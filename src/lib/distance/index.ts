import type { DistanceProvider } from "./types";
import { haversineProvider } from "./haversine";
import { openRouteServiceProvider } from "../../lib/distance/ors";


export function getDistanceProvider(): DistanceProvider {
  const providerName = process.env.DISTANCE_PROVIDER ?? "haversine";

  switch (providerName) {
    case "openrouteservice":
      return openRouteServiceProvider;
    case "haversine":
      return haversineProvider;

    default:
      console.warn(
        `Unknown DISTANCE_PROVIDER "${providerName}", falling back to haversine`
      );
      return haversineProvider;
  }
}

export type { DistanceProvider, RoutePoint } from "./types";