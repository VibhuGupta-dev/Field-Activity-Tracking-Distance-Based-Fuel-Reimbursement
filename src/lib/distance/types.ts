export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: Date;
}

export interface DistanceResult {
  distanceKm: number;
  // Jo provider ne asal mein calculation kiya — "openrouteservice" provider
  // internally Haversine pe fallback ho sakta hai, us case mein ye field
  // "haversine" hoga, chahe caller ne openrouteservice provider request
  // kiya ho. Iska matlab DB mein hamesha sach record hota hai.
  providerUsed: "haversine" | "openrouteservice";
}

export interface DistanceProvider {
  name: string;
  /**
   * Points ko already-sorted (timestamp order) expect karta hai. Consecutive
   * pairs ke beech distance nikal ke sum return karta hai, kilometres mein.
   */
  calculateRouteDistanceKm(points: RoutePoint[]): Promise<DistanceResult>;
}