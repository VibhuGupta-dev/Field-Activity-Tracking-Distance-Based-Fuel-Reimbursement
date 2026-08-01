import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db/connect";
import { getSession } from "@/src/lib/auth/getSession";
import Lead from "@/src/models/Lead";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  await connectDB();
  const leads = await Lead.find().sort({ name: 1 }).lean();
   console.log(leads)
  return NextResponse.json({ leads }, { status: 200 });
}
