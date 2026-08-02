import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/src/lib/db/connect";
import { getSession } from "@/src/lib/auth/getSession";
import { toDateKeyIST } from "@/src/lib/date/dateKey";
import { getDistanceProvider, type RoutePoint } from "@/src/lib/distance";
import User from "@/src/models/User";
import DaySession from "@/src/models/Daysession";
import Activity from "@/src/models/Activity";

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format");

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "branch-head") {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const dateParam = req.nextUrl.searchParams.get("date");
    const dateKey = dateParam
      ? dateKeySchema.parse(dateParam)
      : toDateKeyIST(new Date());

    await connectDB();

    // Sirf apni team ke associates — access control isi query se enforce
    // hota hai, doosre branch-head ka data kabhi is response mein nahi aata.
    const teamMembers = await User.find({
      role: "sales-associate",
      reportsTo: session.userId,
    })
      .select("_id name email")
      .lean();

    const teamMemberIds = teamMembers.map((m) => m._id);

    const daySessions = await DaySession.find({
      associate: { $in: teamMemberIds },
      dateKey,
    }).lean();

    const daySessionByAssociate = new Map(
      daySessions.map((ds) => [ds.associate.toString(), ds])
    );

    const daySessionIds = daySessions.map((ds) => ds._id);
    const activities = await Activity.find({ daySession: { $in: daySessionIds } })
      .populate("lead", "name")
      .sort({ timestamp: 1 })
      .lean();

    const activitiesByAssociate = new Map<string, typeof activities>();
    for (const activity of activities) {
      const key = activity.associate.toString();
      if (!activitiesByAssociate.has(key)) activitiesByAssociate.set(key, []);
      activitiesByAssociate.get(key)!.push(activity);
    }

    const distanceProvider = getDistanceProvider();

    const team = await Promise.all(
      teamMembers.map(async (member) => {
        const memberKey = member._id.toString();
        const daySession = daySessionByAssociate.get(memberKey);
        const memberActivities = activitiesByAssociate.get(memberKey) ?? [];

        let totalDistanceKm: number | null = daySession?.totalDistanceKm ?? null;

        // Din abhi open hai (cached distance nahi) — ab tak ke route ka
        // live distance nikaal ke dikhate hain, jaisa associate's own view
        // mein bhi karte hain.
        if (daySession && daySession.status === "open") {
          const routePoints: RoutePoint[] = [
            {
              lat: daySession.startLocation.lat,
              lng: daySession.startLocation.lng,
              timestamp: daySession.startTimestamp,
            },
            ...memberActivities.map((a) => ({
              lat: a.location.lat,
              lng: a.location.lng,
              timestamp: a.timestamp,
            })),
          ];
          const raw = await distanceProvider.calculateRouteDistanceKm(routePoints);
          totalDistanceKm = Math.round(raw.distanceKm * 100) / 100;
        }

        return {
          associateId: member._id,
          associateName: member.name,
          associateEmail: member.email,
          status: daySession?.status ?? "not-started",
          totalDistanceKm,
          activities: memberActivities,
        };
      })
    );

    return NextResponse.json({ dateKey, team }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: err.issues[0]?.message ?? "Invalid date" },
        { status: 400 }
      );
    }
    console.error("Branch head team view error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
