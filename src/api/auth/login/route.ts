import { NextRequest, NextResponse } from "next/server";
import { mongoconnect } from "@/src/lib/mongoose.connect";

export async function POST(req: NextRequest) {
  try {
    await mongoconnect(req, NextResponse.next());

    return NextResponse.json({
      message: "Login route hit",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Authentication failed", success: false },
      { status: 500 }
    );
  }
}
