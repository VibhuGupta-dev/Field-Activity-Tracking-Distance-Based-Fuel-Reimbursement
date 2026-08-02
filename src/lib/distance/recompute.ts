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