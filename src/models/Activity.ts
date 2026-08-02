import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { GeoPointSchema, type IGeoPoint } from "./shared/GeoPoint";

export type ActivityType = "in-person-meeting";

export interface IActivity extends Document {
  _id: Types.ObjectId;
  daySession: Types.ObjectId; 
  associate: Types.ObjectId; 
  lead: Types.ObjectId; 
  type: ActivityType;
  notes: string;
  location: IGeoPoint;
  timestamp: Date; 
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    daySession: {
      type: Schema.Types.ObjectId,
      ref: "DaySession",
      required: true,
    },
    associate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    type: {
      type: String,
      enum: ["in-person-meeting"],
      default: "in-person-meeting",
      required: true,
    },
    notes: {
      type: String,
      required: [true, "Meeting notes are required"],
      trim: true,
    },
    location: {
      type: GeoPointSchema,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Day ki timeline banane ke liye — timestamp order se activities nikalni
// hain, insertion order se nahi (assessment ka explicit requirement).
ActivitySchema.index({ daySession: 1, timestamp: 1 });
ActivitySchema.index({ associate: 1, timestamp: 1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;