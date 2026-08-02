import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

const mongoUri = process.env.NEXT_MONGO_URI;

export async function mongoconnect(req: NextRequest): Promise<NextResponse> {
  try {
    if (!mongoUri) {
      return NextResponse.json(
        { message: "MongoDB URI is not configured" },
        { status: 500 }
      );
    }

    await mongoose.connect(mongoUri);
    console.log("mongodb is running");

    return NextResponse.json({ message: "MongoDB connected" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "error in connection" }, { status: 500 });
  }
}