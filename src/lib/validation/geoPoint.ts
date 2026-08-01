import { z } from "zod";

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyMeters: z.number().nonnegative().optional(),
});

export type GeoPointInput = z.infer<typeof geoPointSchema>;
