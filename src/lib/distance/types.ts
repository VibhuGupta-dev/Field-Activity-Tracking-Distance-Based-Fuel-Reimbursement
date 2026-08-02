export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: Date;
}

export interface DistanceResult {
  distanceKm: number;
  
  providerUsed: "haversine" | "openrouteservice";
}

export interface DistanceProvider {
  name: string;
  
  calculateRouteDistanceKm(points: RoutePoint[]): Promise<DistanceResult>;
}