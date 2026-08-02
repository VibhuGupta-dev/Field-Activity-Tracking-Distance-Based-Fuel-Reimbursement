import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/src/lib/db/connect";
import { getSession } from "@/src/lib/auth/getSession";
import { geoPointSchema } from "@/src/lib/validation/geoPoint";
import Lead from "@/src/models/Lead";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  await connectDB();
  const leads = await Lead.find().sort({ name: 1 }).lean();

  return NextResponse.json({ leads }, { status: 200 });
}

const createLeadSchema = z.object({
  name: z.string().trim().min(2, "Lead name must be at least 2 characters"),
  contact: z.string().trim().min(1, "Contact is required"),
  location: geoPointSchema,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "branch-head") {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await connectDB();

    const lead = await Lead.create(parsed.data);

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    console.error("Create lead error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

