import type { DistanceProvider, RoutePoint } from "./types";
import { haversineProvider } from "./haversine";

const ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-car";

/**
 * Edge case: "two consecutive points are identical" — ORS rejects duplicate
 * back-to-back waypoints (poor GPS fix, ya activity logged turant Start Day
 * ke baad). Consecutive duplicates ko collapse kar dete hain before calling
 * the API; zero-distance hop route ko affect nahi karta.
 */
function dedupeConsecutive(points: RoutePoint[]): RoutePoint[] {
  const result: RoutePoint[] = [];
  for (const point of points) {
    const last = result[result.length - 1];
    const isSameAsLast = last && last.lat === point.lat && last.lng === point.lng;
    if (!isSameAsLast) result.push(point);
  }
  return result;
}

async function fetchRouteDistanceMeters(points: RoutePoint[]): Promise<number> {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    throw new Error("ORS_API_KEY is not set");
  }

  // ORS expects [lng, lat] order — opposite of how we store points
  const coordinates = points.map((p) => [p.lng, p.lat]);

  const res = await fetch(ORS_DIRECTIONS_URL, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ coordinates }),
    // Free tier can be slow under load — don't hang the request forever
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`ORS request failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const distanceMeters = data?.routes?.[0]?.summary?.distance;

  if (typeof distanceMeters !== "number") {
    throw new Error("ORS response missing route distance");
  }

  return distanceMeters;
}

export const openRouteServiceProvider: DistanceProvider = {
  name: "openrouteservice",
  async calculateRouteDistanceKm(points: RoutePoint[]): Promise<number> {
    // Defensive sort — same contract as haversine provider
    const sorted = [...points].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const deduped = dedupeConsecutive(sorted);
    if (deduped.length < 2) return 0;

    try {
      const meters = await fetchRouteDistanceMeters(deduped);
      return meters / 1000;
    } catch (err) {
      // A routing-API failure (no key, quota exhausted, network blip,
      // unreachable waypoint) must never block fuel reimbursement from
      // being calculated. We fall back to haversine and log a warning so
      // it's visible in server logs, but the request still succeeds.
      console.warn(
        "OpenRouteService failed, falling back to haversine:",
        err instanceof Error ? err.message : err
      );
      return haversineProvider.calculateRouteDistanceKm(deduped);
    }
  },
};