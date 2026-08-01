import { Schema } from "mongoose";

/**
 * GeoPoint captures a single location reading from the browser's
 * Geolocation API. Reused for: day-start location, day-end location,
 * and each activity's location.
 *
 * accuracyMeters aata hai `position.coords.accuracy` se — jitna zyada
 * ye number, utni kam bharosemand location hai. UI mein ise dikhaya
 * ja sakta hai (bonus requirement: "display accuracy radius").
 */
export interface IGeoPoint {
  lat: number;
  lng: number;
  accuracyMeters?: number | null;
}

export const GeoPointSchema = new Schema<IGeoPoint>(
  {
    lat: {
      type: Number,
      required: true,
      min: [-90, "Invalid latitude"],
      max: [90, "Invalid latitude"],
    },
    lng: {
      type: Number,
      required: true,
      min: [-180, "Invalid longitude"],
      max: [180, "Invalid longitude"],
    },
    accuracyMeters: {
      type: Number,
      default: null,
    },
  },
  { _id: false } // subdocument hai, apna alag _id nahi chahiye
);