import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

const mongoUri = process.env.NEXT_MONGO_URI;

export async function mongoconnect(
  req: NextRequest,
  res: NextResponse
): Promise<NextResponse> {
  try {
    if (!mongoUri) {
      return res.status(500).json({ message: "MongoDB URI is not configured" });
    }

    await mongoose.connect(mongoUri);
    console.log("mongodb is running");

    return res.status(200).json({ message: "MongoDB connected" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "error in connection" });
  }
}