/**
 * Signed session cookie for credential auth.
 * Uses JWT (HS256) when JWT_SECRET is set — otherwise falls back to plain JSON (insecure, dev only).
 */
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

export type AuthUser = {
  id: number;
  username: string;
  role: "user" | "admin";
  permissions: string[];
};

function getSecret(): Uint8Array | null {
  const s = ENV.cookieSecret;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Signs the session payload as a JWT. Returns plain JSON if no secret (dev fallback).
 */
export async function signAuthSession(payload: AuthUser): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    return JSON.stringify(payload);
  }
  const exp = Math.floor((Date.now() + SESSION_EXPIRY_MS) / 1000);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .sign(secret);
}

/**
 * Verifies and parses the session. Tries JWT first; if invalid, tries plain JSON (legacy).
 */
export async function verifyAuthSession(cookieValue: string | undefined | null): Promise<AuthUser | null> {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const trimmed = cookieValue.trim();

  // JWT format
  if (trimmed.startsWith("eyJ")) {
    const secret = getSecret();
    if (!secret) return null;
    try {
      const { payload } = await jwtVerify(trimmed, secret);
      const id = payload.id as number;
      const username = payload.username as string;
      const role = payload.role as "user" | "admin";
      const permissions = (payload.permissions as string[]) ?? [];
      if (id == null || !username || !role) return null;
      return { id, username, role, permissions };
    } catch {
      return null;
    }
  }

  // Legacy plain JSON
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.id != null && parsed?.username && parsed?.role) {
      return parsed as AuthUser;
    }
  } catch {
    // ignore
  }
  return null;
}
