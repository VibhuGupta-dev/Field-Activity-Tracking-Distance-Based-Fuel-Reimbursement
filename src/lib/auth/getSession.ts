import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "./cookies";
import { verifyAuthToken, type AuthTokenPayload } from "./jwt";

/**
 * Server Components aur Route Handlers ke andar current logged-in user
 * nikalne ke liye. Cookie nahi hai ya token invalid/expired hai to null.
 */
export async function getSession(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}
