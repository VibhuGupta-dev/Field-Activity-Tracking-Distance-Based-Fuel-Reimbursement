import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { GeoPointSchema, type IGeoPoint } from "./shared/GeoPoint";

export interface ILead extends Document {
  _id: Types.ObjectId;
  name: string;
  contact: string; // phone or email — free text, kept simple per assessment scope
  location: IGeoPoint;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, "Lead name is required"],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, "Lead contact is required"],
      trim: true,
    },
    location: {
      type: GeoPointSchema,
      required: true,
    },
  },
  { timestamps: true }
);

LeadSchema.index({ name: 1 });

const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;