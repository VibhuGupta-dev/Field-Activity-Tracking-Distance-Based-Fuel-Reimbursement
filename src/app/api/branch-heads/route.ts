import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db/connect";
import User from "@/src/models/User";

/**
 * Intentionally unauthenticated — signup form ko ye list associate ke
 * account banne se PEHLE chahiye hoti hai, isliye cookie/session pe
 * depend nahi kar sakte. Sirf naam aur id return karte hain, koi
 * email/password/sensitive field nahi.
 */
export async function GET() {
  await connectDB();

  const branchHeads = await User.find({ role: "branch-head" })
    .select("_id name")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ branchHeads }, { status: 200 });
}
