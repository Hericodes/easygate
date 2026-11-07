import crypto from "crypto";
import { decodeJwt } from "jose";

/** Short-lived cookie holding state + PKCE verifier during sign-in. */
export const OAUTH_COOKIE = "eg_oauth";

export const googleEnabled = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const redirectUri = (origin: string) =>
  `${process.env.APP_URL ?? origin}/api/auth/google/callback`;

const b64url = (buf: Buffer) => buf.toString("base64url");

/** Random state (CSRF protection) and PKCE verifier/challenge for one sign-in attempt. */
export function newOAuthAttempt() {
  const state = b64url(crypto.randomBytes(24));
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  return { state, verifier, challenge };
}

export function authorizationUrl(origin: string, state: string, challenge: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export type GoogleProfile = { sub: string; email: string; name: string };

/**
 * Exchanges the authorization code for tokens. The ID token comes straight from
 * Google's token endpoint over TLS (authenticated with our client secret), so
 * decoding it and checking issuer/audience is sufficient here.
 */
export async function exchangeCode(origin: string, code: string, verifier: string): Promise<GoogleProfile> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok || !body.id_token) throw new Error(body.error_description ?? "Google token exchange failed");

  const claims = decodeJwt(body.id_token);
  const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!issOk || claims.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("Invalid Google ID token");
  if (!claims.email || claims.email_verified !== true) throw new Error("Google email not verified");

  return {
    sub: String(claims.sub),
    email: String(claims.email).toLowerCase(),
    name: String(claims.name ?? String(claims.email).split("@")[0]),
  };
}
