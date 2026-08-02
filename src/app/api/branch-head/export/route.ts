import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/src/lib/db/connect";
import { getSession } from "@/src/lib/auth/getSession";
import { toCsv } from "@/src/lib/csv/toCsv";
import User from "@/src/models/User";
import DaySession from "@/src/models/Daysession";

const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format");

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "branch-head") {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const monthParam = req.nextUrl.searchParams.get("month");
    const parsedMonth = monthSchema.safeParse(monthParam);
    if (!parsedMonth.success) {
      return NextResponse.json(
        { message: parsedMonth.error.issues[0]?.message ?? "Invalid month" },
        { status: 400 }
      );
    }
    const month = parsedMonth.data;

    await connectDB();

    const teamMembers = await User.find({
      role: "sales-associate",
      reportsTo: session.userId,
    })
      .select("_id name email")
      .lean();

    const teamMemberIds = teamMembers.map((m) => m._id);

    // Sirf "closed" sessions count hoti hain — ye final, reliable figure hai
    // jo HR ko fuel reimbursement ke liye di jaati hai. Ek din jo abhi bhi
    // "open" hai (associate ne end nahi kiya) is total mein shamil nahi
    // hota jab tak close na ho jaye. Assumption README mein documented hai.
    const daySessions = await DaySession.find({
      associate: { $in: teamMemberIds },
      dateKey: { $regex: `^${month}` },
      status: "closed",
    }).lean();

    const distanceByAssociate = new Map<string, number>();
    for (const ds of daySessions) {
      const key = ds.associate.toString();
      const prev = distanceByAssociate.get(key) ?? 0;
      distanceByAssociate.set(key, prev + (ds.totalDistanceKm ?? 0));
    }

    const rows = teamMembers.map((member) => {
      const total = distanceByAssociate.get(member._id.toString()) ?? 0;
      return [member.name, member.email, month, Math.round(total * 100) / 100];
    });

    const csv = toCsv(
      ["Associate Name", "Email", "Month", "Total Distance (km)"],
      rows
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="raha-fuel-reimbursement-${month}.csv"`,
      },
    });
  } catch (err) {
    console.error("Monthly export error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
