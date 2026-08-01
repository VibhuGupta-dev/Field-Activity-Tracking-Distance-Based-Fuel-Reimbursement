import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/src/lib/db/connect";
import { getSession } from "@/src/lib/auth/getSession";
import { toDateKeyIST } from "@/src/lib/date/dateKey";
import { getDistanceProvider, type RoutePoint } from "@/src/lib/distance";
import DaySession from "@/src/models/Daysession";
import Activity from "@/src/models/Activity";

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format");

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "sales-associate") {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const dateParam = req.nextUrl.searchParams.get("date");
    const dateKey = dateParam
      ? dateKeySchema.parse(dateParam)
      : toDateKeyIST(new Date());

    await connectDB();

    // Assumption: ek associate ka ek calendar day mein zyada se zyada ek
    // DaySession hota hai (partial unique index sirf "open" ko block karta
    // hai, isliye theoretically same din dobara start-end ho sakta hai —
    // us case mein latest wala dikhaya jaata hai). README mein note kiya hai.
    const daySession = await DaySession.findOne({
      associate: session.userId,
      dateKey,
    }).sort({ startTimestamp: -1 });

    if (!daySession) {
      return NextResponse.json(
        { message: "No day session found for this date" },
        { status: 404 }
      );
    }

    const activities = await Activity.find({ daySession: daySession._id })
      .populate("lead", "name contact")
      .sort({ timestamp: 1 })
      .lean();

    let totalDistanceKm = daySession.totalDistanceKm;

    // Din abhi bhi open hai — cached value nahi hai, isliye ab tak ke route
    // ka live distance calculate karke dikhate hain (start -> activities so far).
    if (daySession.status === "open") {
      const routePoints: RoutePoint[] = [
        {
          lat: daySession.startLocation.lat,
          lng: daySession.startLocation.lng,
          timestamp: daySession.startTimestamp,
        },
        ...activities.map((activity) => ({
          lat: activity.location.lat,
          lng: activity.location.lng,
          timestamp: activity.timestamp,
        })),
      ];

      const distanceProvider = getDistanceProvider();
      const rawDistanceKm = await distanceProvider.calculateRouteDistanceKm(routePoints);
      totalDistanceKm = Math.round(rawDistanceKm * 100) / 100;
    }

    return NextResponse.json(
      {
        daySession: {
          id: daySession._id,
          dateKey: daySession.dateKey,
          status: daySession.status,
          startLocation: daySession.startLocation,
          startTimestamp: daySession.startTimestamp,
          endLocation: daySession.endLocation,
          endTimestamp: daySession.endTimestamp,
          totalDistanceKm,
        },
        activities,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: err.errors[0]?.message ?? "Invalid date" },
        { status: 400 }
      );
    }
    console.error("View own day error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
