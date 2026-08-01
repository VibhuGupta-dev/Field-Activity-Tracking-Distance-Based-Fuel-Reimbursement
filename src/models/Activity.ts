import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { GeoPointSchema, type IGeoPoint } from "./shared/GeoPoint";

export type ActivityType = "in-person-meeting";

export interface IActivity extends Document {
  _id: Types.ObjectId;
  daySession: Types.ObjectId; // ref DaySession — jis din ke andar ye activity hui
  associate: Types.ObjectId; // ref User — denormalized: daySession se hi mil jata,
  // par direct access-control checks aur queries ke liye yahan bhi rakha
  // (e.g. "is activity kisi aur associate ka to nahi?" — bina daySession
  // populate kiye seedha check ho jata hai).
  lead: Types.ObjectId; // ref Lead — kis client se milne gaye
  type: ActivityType;
  notes: string;
  location: IGeoPoint;
  timestamp: Date; // activity log hone ke waqt ka capture — ordering isi pe hoti hai

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