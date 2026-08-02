import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/src/lib/db/connect";
import { getSession } from "@/src/lib/auth/getSession";
import { geoPointSchema } from "@/src/lib/validation/geoPoint";
import DaySession from "@/src/models/Daysession";
import Activity from "@/src/models/Activity";
import Lead from "@/src/models/Lead";

const addActivitySchema = z.object({
  leadId: z.string().min(1, "leadId is required"),
  notes: z.string().trim().min(1, "Notes are required"),
  location: geoPointSchema,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "sales-associate") {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { leadId, notes, location } = parsed.data;

    await connectDB();


    const openSession = await DaySession.findOne({
      associate: session.userId,
      status: "open",
    });

    if (!openSession) {
      return NextResponse.json(
        { message: "Start your day before logging an activity" },
        { status: 400 }
      );
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    const activity = await Activity.create({
      daySession: openSession._id,
      associate: session.userId,
      lead: lead._id,
      type: "in-person-meeting",
      notes,
      location,
      timestamp: new Date(),
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err) {
    console.error("Add activity error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
