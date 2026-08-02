import type { DistanceProvider } from "./types";
import { haversineProvider } from "./haversine";
import { openRouteServiceProvider } from "../../lib/distance/ors";

/**
 * Provider env var se select hota hai — DISTANCE_PROVIDER=openrouteservice
 * (recommended, road distance) ya "haversine" (fallback, straight-line).
 * Naya provider add karna ho to bas:
 *   1. is file mein ek naya "case" add karo
 *   2. wo naya provider implement karo (ors.ts / haversine.ts jaisi file)
 * Baaki poora codebase (routes, DaySession model) bilkul unchanged rehta hai
 * — sab DistanceProvider interface ke against likha hai, concrete
 * implementation ke against nahi.
 */
export function getDistanceProvider(): DistanceProvider {
  const providerName = process.env.DISTANCE_PROVIDER ?? "haversine";

  switch (providerName) {
    case "openrouteservice":
      return openRouteServiceProvider;
    case "haversine":
      return haversineProvider;
    // case "osrm": return osrmProvider;
    // case "mapbox": return mapboxProvider;
    default:
      console.warn(
        `Unknown DISTANCE_PROVIDER "${providerName}", falling back to haversine`
      );
      return haversineProvider;
  }
}

export type { DistanceProvider, RoutePoint } from "./types";