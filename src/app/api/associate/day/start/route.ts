import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db/connect";
import { getSession } from "@/src/lib/auth/getSession";
import { geoPointSchema } from "@/src/lib/validation/geoPoint";
import { toDateKeyIST } from "@/src/lib/date/dateKey";
import DaySession from "@/src/models/Daysession";

const startDaySchema = geoPointSchema;

export async function POST(req: NextRequest) {
  try {
    // Middleware already role-gates /api/associate/*, par defense-in-depth
    // ke liye route handler khud bhi session verify karta hai.
    const session = await getSession();
    if (!session || session.role !== "sales-associate") {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = startDaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0]?.message ?? "Invalid location" },
        { status: 400 }
      );
    }

    await connectDB();

    // Edge case: "Start Day" already open — clean check pehle (fast, clear
    // error message), DB unique index niche safety-net ke roop mein hai.
    const existingOpenSession = await DaySession.findOne({
      associate: session.userId,
      status: "open",
    });

    if (existingOpenSession) {
      return NextResponse.json(
        { message: "A day is already in progress. End it before starting a new one." },
        { status: 409 }
      );
    }

    const now = new Date();

    const daySession = await DaySession.create({
      associate: session.userId,
      dateKey: toDateKeyIST(now),
      status: "open",
      startLocation: parsed.data,
      startTimestamp: now,
      endLocation: null,
      endTimestamp: null,
      totalDistanceKm: null,
      distanceProvider: null,
    });

    return NextResponse.json({ daySession }, { status: 201 });
  } catch (err: unknown) {
    // Race condition: do requests ek saath aayi aur dono ne "no open session"
    // dekha — DB ka partial unique index yahan duplicate-key error (11000)
    // throw karega, use hum clean 409 mein convert kar dete hain.
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { message: "A day is already in progress. End it before starting a new one." },
        { status: 409 }
      );
    }

    console.error("Start day error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
