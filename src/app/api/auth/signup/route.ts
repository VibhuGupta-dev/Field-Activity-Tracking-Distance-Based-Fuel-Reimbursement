import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/src/lib/db/connect";
import User from "@/src/models/User";
import { hashPassword } from "@/src/lib/auth/password";
import { signAuthToken } from "@/src/lib/auth/jwt";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/src/lib/auth/cookies";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["sales-associate", "branch-head"]).default("sales-associate"),
  branchHeadId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    console.log("hey")
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    console.log(body , parsed)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, role, branchHeadId } = parsed.data;

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    let reportsTo = null;
    if (role === "sales-associate" && branchHeadId) {
      const branchHead = await User.findOne({
        _id: branchHeadId,
        role: "branch-head",
      });
      if (!branchHead) {
        return NextResponse.json(
          { message: "Selected branch head not found" },
          { status: 400 }
        );
      }
      reportsTo = branchHead._id;
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      reportsTo,
    });

    const token = await signAuthToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
