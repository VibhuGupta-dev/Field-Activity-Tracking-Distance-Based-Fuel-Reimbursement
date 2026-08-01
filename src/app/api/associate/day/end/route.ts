import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db/connect";
import { getSession } from "@/src/lib/auth/getSession";
import { geoPointSchema } from "@/src/lib/validation/geoPoint";
import { getDistanceProvider, type RoutePoint } from "@/src/lib/distance";
import DaySession from "@/src/models/Daysession";
import Activity from "@/src/models/Activity";

const endDaySchema = geoPointSchema;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "sales-associate") {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = endDaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0]?.message ?? "Invalid location" },
        { status: 400 }
      );
    }

    await connectDB();

    // Edge case: "ends a day that was never started"
    const openSession = await DaySession.findOne({
      associate: session.userId,
      status: "open",
    });

    if (!openSession) {
      return NextResponse.json(
        { message: "No active day to end" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Route ke saare points, timestamp order mein: start -> activities -> end
    const activities = await Activity.find({ daySession: openSession._id })
      .sort({ timestamp: 1 })
      .lean();

    const routePoints: RoutePoint[] = [
      {
        lat: openSession.startLocation.lat,
        lng: openSession.startLocation.lng,
        timestamp: openSession.startTimestamp,
      },
      ...activities.map((activity) => ({
        lat: activity.location.lat,
        lng: activity.location.lng,
        timestamp: activity.timestamp,
      })),
      {
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        timestamp: now,
      },
    ];

    const distanceProvider = getDistanceProvider();
    const rawDistanceKm = await distanceProvider.calculateRouteDistanceKm(routePoints);
    // "Report distance in kilometres, rounded sensibly" — 2 decimal places
    const totalDistanceKm = Math.round(rawDistanceKm * 100) / 100;

    openSession.endLocation = parsed.data;
    openSession.endTimestamp = now;
    openSession.status = "closed";
    openSession.totalDistanceKm = totalDistanceKm;
    openSession.distanceProvider = distanceProvider.name as typeof openSession.distanceProvider;

    await openSession.save();

    return NextResponse.json({ daySession: openSession }, { status: 200 });
  } catch (err) {
    console.error("End day error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
