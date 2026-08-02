import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/src/lib/db/connect";
import User from "@/src/models/User";
import { comparePassword } from "@/src/lib/auth/password";
import { signAuthToken } from "@/src/lib/auth/jwt";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/src/lib/auth/cookies";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    await connectDB();

    // passwordHash pe select:false hai schema mein, isliye explicitly select karo
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

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
      { status: 200 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
