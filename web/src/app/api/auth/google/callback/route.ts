import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import { OAUTH_COOKIE, exchangeCode, googleEnabled } from "@/lib/google";
import { CAMPUS } from "@/lib/campus";

/** Google redirects here with ?code&state after the user picks an account. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (error: string) =>
    NextResponse.redirect(new URL(`/login?error=${error}`, url.origin));

  if (!googleEnabled()) return fail("google-not-configured");
  if (url.searchParams.get("error")) return fail("google-cancelled"); // user pressed Cancel

  const jar = await cookies();
  const raw = jar.get(OAUTH_COOKIE)?.value;
  jar.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
  let saved: { state: string; verifier: string; next: string };
  try {
    saved = JSON.parse(raw ?? "");
  } catch {
    return fail("google-expired");
  }
  const code = url.searchParams.get("code");
  if (!code || url.searchParams.get("state") !== saved.state) return fail("google-expired");

  try {
    const profile = await exchangeCode(url.origin, code, saved.verifier);

    // 1) returning Google user, 2) existing email account → link Google, 3) brand-new student
    let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });
    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
      user = byEmail
        ? await prisma.user.update({ where: { id: byEmail.id }, data: { googleId: profile.sub } })
        : await prisma.user.create({
            data: {
              name: profile.name,
              email: profile.email,
              googleId: profile.sub,
              campus: CAMPUS,
              role: "STUDENT",
            },
          });
    }

    await setSessionCookie(await createToken(user.id));
    return NextResponse.redirect(new URL(saved.next || "/", url.origin));
  } catch (err) {
    console.error("Google sign-in failed", err);
    return fail("google-failed");
  }
}
