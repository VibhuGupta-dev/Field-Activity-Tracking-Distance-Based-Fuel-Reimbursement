import type { DistanceProvider, DistanceResult, RoutePoint } from "./types";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Do lat/lng points ke beech straight-line ("as the crow flies") distance,
 * kilometres mein.
 *
 * NOTE: Ye road distance nahi hai — fuel reimbursement ke liye actual driven
 * distance under-report karega. README mein ye limitation clearly likhi hai
 * (assessment ki instruction ke mutabik).
 */
function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_KM * c;
}

export const haversineProvider: DistanceProvider = {
  name: "haversine",
  async calculateRouteDistanceKm(points: RoutePoint[]): Promise<DistanceResult> {
    if (points.length < 2) return { distanceKm: 0, providerUsed: "haversine" };

    // Defensive sort — caller ko already sorted bhejna chahiye, par yahan
    // dobara ensure kar lete hain (timestamp order, insertion order nahi).
    const sorted = [...points].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    let total = 0;
    for (let i = 1; i < sorted.length; i++) {
      // Do consecutive identical points (poor GPS fix, ya turant dobara
      // capture) ka distance 0 aata hai — koi special-case ki zaroorat
      // nahi, formula khud hi safely 0 return karta hai.
      total += haversineDistanceKm(sorted[i - 1], sorted[i]);
    }

    return { distanceKm: total, providerUsed: "haversine" };
  },
};