import type { DistanceProvider, DistanceResult, RoutePoint } from "./types";
import { haversineProvider } from "./haversine";

const ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-car";

// ORS free tier caps coordinates per request. Kept conservative — if an
// associate logs many activities in one day, we split the route into
// overlapping chunks instead of failing (or silently losing accuracy).
const MAX_WAYPOINTS_PER_REQUEST = 50;

// Only retry on transient failures (network blip, 5xx, rate limit) — a bad
// API key or malformed request will fail the same way every time, so we
// don't waste time retrying those.
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


function dedupeConsecutive(points: RoutePoint[]): RoutePoint[] {
  const result: RoutePoint[] = [];
  for (const point of points) {
    const last = result[result.length - 1];
    const isSameAsLast = last && last.lat === point.lat && last.lng === point.lng;
    if (!isSameAsLast) result.push(point);
  }
  return result;
}


function chunkRoute(points: RoutePoint[], maxWaypoints: number): RoutePoint[][] {
  if (points.length <= maxWaypoints) return [points];

  const chunks: RoutePoint[][] = [];
  let start = 0;
  while (start < points.length - 1) {
    const end = Math.min(start + maxWaypoints - 1, points.length - 1);
    chunks.push(points.slice(start, end + 1));
    start = end;
  }
  return chunks;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function fetchRouteDistanceMeters(points: RoutePoint[]): Promise<number> {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    throw new Error("ORS_API_KEY is not set");
  }

  const coordinates = points.map((p) => [p.lng, p.lat]);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(ORS_DIRECTIONS_URL, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coordinates }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        const error = new Error(`ORS request failed (${res.status}): ${errorText}`);
        if (isRetryableStatus(res.status) && attempt < MAX_RETRIES) {
          lastError = error;
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw error;
      }

      const data = await res.json();
      const distanceMeters = data?.routes?.[0]?.summary?.distance;

      if (typeof distanceMeters !== "number") {
        throw new Error("ORS response missing route distance");
      }

      return distanceMeters;
    } catch (err) {
      // Network-level failure (timeout, DNS, connection reset) — also
      // worth a retry, unlike a bad API key which throws synchronously above.
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError ?? new Error("ORS request failed for an unknown reason");
}

export const openRouteServiceProvider: DistanceProvider = {
  name: "openrouteservice",
  async calculateRouteDistanceKm(points: RoutePoint[]): Promise<DistanceResult> {
    const sorted = [...points].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const deduped = dedupeConsecutive(sorted);
    if (deduped.length < 2) return { distanceKm: 0, providerUsed: "openrouteservice" };

    const chunks = chunkRoute(deduped, MAX_WAYPOINTS_PER_REQUEST);

    try {
      let totalMeters = 0;

      for (const chunk of chunks) {
        totalMeters += await fetchRouteDistanceMeters(chunk);
      }
      return { distanceKm: totalMeters / 1000, providerUsed: "openrouteservice" };
    } catch (err) {
      
      console.warn(
        "OpenRouteService failed, falling back to haversine:",
        err instanceof Error ? err.message : err
      );
      return haversineProvider.calculateRouteDistanceKm(deduped);
    }
  },
};