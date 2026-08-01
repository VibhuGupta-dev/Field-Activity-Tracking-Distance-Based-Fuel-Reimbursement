import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/src/lib/db/connect";
import { getSession } from "@/src/lib/auth/getSession";
import User from "@/src/models/User";
import DaySession from "@/src/models/Daysession";
import Activity from "@/src/models/Activity";

const searchSchema = z.object({
  name: z.string().trim().min(1, "name query param is required"),
});

interface DaySessionHistoryItem {
  id: string;
  dateKey: string;
  status: string;
  totalDistanceKm: number | null;
  startTimestamp: Date;
  endTimestamp: Date | null;
  activityCount: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "branch-head") {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const parsed = searchSchema.safeParse({
      name: req.nextUrl.searchParams.get("name"),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0]?.message ?? "Invalid query" },
        { status: 400 }
      );
    }

    await connectDB();

    // Sirf apni team mein search — kisi doosre branch-head ke associate
    // ka naam match ho bhi jaye to wo yahan kabhi nahi aayega.
    const matchedAssociates = await User.find({
      role: "sales-associate",
      reportsTo: session.userId,
      name: { $regex: parsed.data.name, $options: "i" },
    })
      .select("_id name email")
      .lean();

    if (matchedAssociates.length === 0) {
      return NextResponse.json({ associates: [] }, { status: 200 });
    }

    const associateIds = matchedAssociates.map((a) => a._id);

    const daySessions = await DaySession.find({ associate: { $in: associateIds } })
      .sort({ startTimestamp: -1 })
      .lean();

    const daySessionIds = daySessions.map((ds) => ds._id);
    const activityCounts = await Activity.aggregate([
      { $match: { daySession: { $in: daySessionIds } } },
      { $group: { _id: "$daySession", count: { $sum: 1 } } },
    ]);
    const countByDaySession = new Map<string, number>(
      activityCounts.map((c) => [c._id.toString(), c.count])
    );

    const historyByAssociate = new Map<string, DaySessionHistoryItem[]>();
    for (const ds of daySessions) {
      const key = ds.associate.toString();
      const item: DaySessionHistoryItem = {
        id: ds._id.toString(),
        dateKey: ds.dateKey,
        status: ds.status,
        totalDistanceKm: ds.totalDistanceKm,
        startTimestamp: ds.startTimestamp,
        endTimestamp: ds.endTimestamp,
        activityCount: countByDaySession.get(ds._id.toString()) ?? 0,
      };
      if (!historyByAssociate.has(key)) historyByAssociate.set(key, []);
      historyByAssociate.get(key)!.push(item);
    }

    const associates = matchedAssociates.map((a) => ({
      associateId: a._id,
      associateName: a.name,
      associateEmail: a.email,
      history: historyByAssociate.get(a._id.toString()) ?? [],
    }));

    return NextResponse.json({ associates }, { status: 200 });
  } catch (err) {
    console.error("Branch head search error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
