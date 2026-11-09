import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { prisma } from "./db";

const COOKIE = "eg_session";
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    // Never sign or accept sessions with a guessable fallback on the live site.
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is not set");
    return new TextEncoder().encode("dev-secret");
  }
  return new TextEncoder().encode(value);
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  campus: string | null;
};

export async function createToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

/** Reads the session from the cookie (web) or an Authorization: Bearer header (mobile). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const auth = (await headers()).get("authorization");
  const token = auth?.startsWith("Bearer ")
    ? auth.slice(7)
    : (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, campus: true },
    });
  } catch {
    return null;
  }
}

/**
 * Roles: STUDENT < ORGANIZER < ADMIN < SUPER_ADMIN.
 * Admins review events and organizers; only the super admin can make or remove admins.
 */
export const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  ORGANIZER: "Organizer",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

export function isSuperAdmin(user: { role: string } | null) {
  return user?.role === "SUPER_ADMIN";
}

export function isAdmin(user: { role: string } | null) {
  return user?.role === "ADMIN" || isSuperAdmin(user);
}

export function isOrganizer(user: { role: string } | null) {
  return user?.role === "ORGANIZER" || isAdmin(user);
}
