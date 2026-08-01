import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { GeoPointSchema, type IGeoPoint } from "./shared/GeoPoint";

export type DaySessionStatus = "open" | "closed";
export type DistanceProvider = "haversine" | "osrm" | "openrouteservice" | "mapbox";

export interface IDaySession extends Document {
  _id: Types.ObjectId;
  associate: Types.ObjectId; // ref User (role: sales-associate)

  // "YYYY-MM-DD" — associate's calendar day, derived from startTimestamp.
  // Isse midnight-crossing din bhi ek hi bucket mein group hote hain
  // (monthly export aur "day view" dono isi field pe query karte hain,
  // startTimestamp pe range-query karne ke bajaye).
  dateKey: string;

  status: DaySessionStatus;

  startLocation: IGeoPoint;
  startTimestamp: Date;

  // End Day tak dono null rehte hain
  endLocation: IGeoPoint | null;
  endTimestamp: Date | null;

  // End Day pe (ya on-demand) compute hoke cache ho jata hai — baar baar
  // routing API call na karni pade. null jab tak day close na ho.
  totalDistanceKm: number | null;
  distanceProvider: DistanceProvider | null;

  createdAt: Date;
  updatedAt: Date;
}

const DaySessionSchema = new Schema<IDaySession>(
  {
    associate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "dateKey must be in YYYY-MM-DD format"],
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      required: true,
    },
    startLocation: {
      type: GeoPointSchema,
      required: true,
    },
    startTimestamp: {
      type: Date,
      required: true,
    },
    endLocation: {
      type: GeoPointSchema,
      default: null,
    },
    endTimestamp: {
      type: Date,
      default: null,
    },
    totalDistanceKm: {
      type: Number,
      default: null,
    },
    distanceProvider: {
      type: String,
      enum: ["haversine", "osrm", "openrouteservice", "mapbox"],
      default: null,
    },
  },
  { timestamps: true }
);

// Edge case: "user taps Start Day twice" — DB-level guard, not just app logic.
// Ek associate ka ek waqt mein sirf ek hi "open" session ho sakta hai.
DaySessionSchema.index(
  { associate: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "open" },
  }
);

// Branch-head team view / monthly export ke liye common query pattern
DaySessionSchema.index({ associate: 1, dateKey: 1 });

const DaySession: Model<IDaySession> =
  mongoose.models.DaySession ||
  mongoose.model<IDaySession>("DaySession", DaySessionSchema);

export default DaySession;