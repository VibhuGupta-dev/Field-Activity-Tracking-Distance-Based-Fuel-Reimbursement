import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/src/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/cookies";

const ASSOCIATE_PREFIX = "/associate";
const BRANCH_HEAD_PREFIX = "/branch-head";


const ASSOCIATE_API_PREFIX = "/api/associate";
const BRANCH_HEAD_API_PREFIX = "/api/branch-head";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage =
    pathname.startsWith(ASSOCIATE_PREFIX) || pathname.startsWith(BRANCH_HEAD_PREFIX);
  const isProtectedApi =
    pathname.startsWith(ASSOCIATE_API_PREFIX) || pathname.startsWith(BRANCH_HEAD_API_PREFIX);

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await verifyAuthToken(token);

  if (!session) {
    if (isProtectedApi) {
      return NextResponse.json({ message: "Invalid or expired session" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const wantsAssociate =
    pathname.startsWith(ASSOCIATE_PREFIX) || pathname.startsWith(ASSOCIATE_API_PREFIX);
  const wantsBranchHead =
    pathname.startsWith(BRANCH_HEAD_PREFIX) || pathname.startsWith(BRANCH_HEAD_API_PREFIX);

  if (wantsAssociate && session.role !== "sales-associate") {
    if (isProtectedApi) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (wantsBranchHead && session.role !== "branch-head") {
    if (isProtectedApi) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", session.userId);
  requestHeaders.set("x-user-role", session.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/associate/:path*",
    "/branch-head/:path*",
    "/api/associate/:path*",
    "/api/branch-head/:path*",
  ],
};
