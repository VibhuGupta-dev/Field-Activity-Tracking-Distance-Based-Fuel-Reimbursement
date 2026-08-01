import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" }, { status: 200 });

  // maxAge: 0 se browser turant cookie delete kar deta hai
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
