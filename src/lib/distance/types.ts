export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: Date;
}

export interface DistanceProvider {
  name: string;
  /**
   * Points ko already-sorted (timestamp order) expect karta hai. Consecutive
   * pairs ke beech distance nikal ke sum return karta hai, kilometres mein.
   */
  calculateRouteDistanceKm(points: RoutePoint[]): Promise<number>;
}
