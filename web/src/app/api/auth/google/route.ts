import { NextResponse } from "next/server";
import { OAUTH_COOKIE, authorizationUrl, googleEnabled, newOAuthAttempt } from "@/lib/google";

/** Starts "Continue with Google". ?next=/path is where to land afterwards. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!googleEnabled()) {
    return NextResponse.redirect(new URL("/login?error=google-not-configured", url.origin));
  }
  const rawNext = url.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const { state, verifier, challenge } = newOAuthAttempt();
  const res = NextResponse.redirect(authorizationUrl(url.origin, state, challenge));
  res.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, verifier, next }), {
    httpOnly: true,
    sameSite: "lax", // must survive the top-level redirect back from Google
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
