import { Schema } from "mongoose";


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
