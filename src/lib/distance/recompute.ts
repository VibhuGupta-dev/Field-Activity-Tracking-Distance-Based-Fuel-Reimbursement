import { getDistanceProvider } from "./index";
import type { RoutePoint } from "./types";

interface GeoPointLike {
  lat: number;
  lng: number;
}

interface DaySessionLike {
  startLocation: GeoPointLike;
  startTimestamp: Date;
  endLocation: GeoPointLike | null;
  endTimestamp: Date | null;
}

interface ActivityLike {
  location: GeoPointLike;
  timestamp: Date;
}

/**
 * Builds the ordered route for a day session — Start -> Activities -> End
 * (End only if the day has already been closed) — and runs it through the
 * configured distance provider.
 *
 * Used in two places:
 *  1. POST /api/associate/activity — after logging a new visit, so the
 *     associate sees a running distance total while the day is still open.
 *  2. POST /api/associate/day/end — to compute the final, authoritative
 *     total once the end location is known.
 *
 * Rounds to 2 decimal places ("report distance in kilometres, rounded
 * sensibly") in exactly one place, so End Day and the running total during
 * the day can never disagree on rounding behaviour.
 */
export async function computeDaySessionDistance(
  daySession: DaySessionLike,
  activities: ActivityLike[]
): Promise<{ totalDistanceKm: number; distanceProvider: "haversine" | "openrouteservice" }> {
  const routePoints: RoutePoint[] = [
    {
      lat: daySession.startLocation.lat,
      lng: daySession.startLocation.lng,
      timestamp: daySession.startTimestamp,
    },
    ...activities.map((activity) => ({
      lat: activity.location.lat,
      lng: activity.location.lng,
      timestamp: activity.timestamp,
    })),
  ];

  if (daySession.endLocation && daySession.endTimestamp) {
    routePoints.push({
      lat: daySession.endLocation.lat,
      lng: daySession.endLocation.lng,
      timestamp: daySession.endTimestamp,
    });
  }

  const provider = getDistanceProvider();
  const result = await provider.calculateRouteDistanceKm(routePoints);

  return {
    totalDistanceKm: Math.round(result.distanceKm * 100) / 100,
    distanceProvider: result.providerUsed,
  };
}