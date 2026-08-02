import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/src/models/User";

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  email: string;
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Please define JWT_SECRET in your .env.local file");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);
const TOKEN_EXPIRY = "7d";

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secretKey);
}

export async function verifyAuthToken(
  token: string
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    // jose payload generic JWTPayload hota hai, apne shape mein cast kar rahe
    return payload as unknown as AuthTokenPayload;
  } catch {
    // expired ya tampered token — dono case mein null treat karo
    return null;
  }
}
