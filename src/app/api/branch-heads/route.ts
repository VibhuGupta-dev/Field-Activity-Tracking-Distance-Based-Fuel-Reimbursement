import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db/connect";
import User from "@/src/models/User";


export async function GET() {
  await connectDB();

  const branchHeads = await User.find({ role: "branch-head" })
    .select("_id name")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ branchHeads }, { status: 200 });
}
