"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CrowdSilhouette, GateSilhouette } from "./Art";
import { LockIcon, PartyIcon, TicketIcon, ZapIcon } from "./icons";

const GOOGLE_ERRORS: Record<string, string> = {
  "google-cancelled": "Google sign-in was cancelled.",
  "google-expired": "Google sign-in timed out. Please try again.",
  "google-failed": "We couldn't sign you in with Google. Please try again.",
  "google-not-configured": "Google sign-in isn't set up yet. Use your email and password.",
};

const PERKS = [
  { Icon: TicketIcon, text: "Tickets for every OOU party, concert and program" },
  { Icon: ZapIcon, text: "Pay in seconds, get a QR code instantly" },
  { Icon: LockIcon, text: "Secure checkout with Paystack" },
];

export default function AuthForm({
  mode,
  googleEnabled,
}: {
  mode: "login" | "signup";
  googleEnabled: boolean;
}) {
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "";
  // Only allow same-site paths, so ?next= can't bounce users to another site.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const [error, setError] = useState(GOOGLE_ERRORS[params.get("error") ?? ""] ?? "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setError(body.error);
    }
    // The session cookie is now set (signup logs you in too). A full page load
    // makes the whole site, including the header, pick up the signed-in state.
    window.location.href = next;
  }

  return (
    <div className="animate-fade-up mx-auto grid max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-30px_rgb(59_7_100/0.4)] ring-1 ring-line lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel (large screens) */}
      <div className="hero-surface relative isolate hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <GateSilhouette className="absolute right-6 top-8 -z-10 h-40 w-56 text-white/[0.12]" />
        <CrowdSilhouette className="absolute inset-x-0 bottom-0 -z-10 h-28 w-full text-[#12042a]/80" />
        <span
          aria-hidden
          className="animate-float absolute right-12 top-48 grid h-16 w-16 place-items-center rounded-2xl bg-white/15 shadow-xl ring-1 ring-white/25 backdrop-blur-md"
          style={{ "--r": "-12deg" } as React.CSSProperties}
        >
          <TicketIcon className="h-8 w-8" />
        </span>
        <span
          aria-hidden
          className="animate-float absolute bottom-48 right-24 grid h-14 w-14 place-items-center rounded-2xl bg-white/15 shadow-xl ring-1 ring-white/25 backdrop-blur-md"
          style={{ animationDelay: "-3s", "--r": "10deg" } as React.CSSProperties}
        >
          <PartyIcon className="h-7 w-7" />
        </span>
        <div className="relative pt-14">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-200">Jiivent</p>
          <p className="mt-2 text-4xl font-extrabold leading-tight">
            {mode === "login" ? "Welcome back to the gate" : "Your OOU plans start here"}
          </p>
          <p className="mt-3 max-w-sm text-white/80">
            {mode === "login"
              ? "Your tickets, your events, all in one place."
              : "Discover what's on at OOU and never miss a good event."}
          </p>
        </div>
        <ul className="relative space-y-3 text-sm font-medium">
          {PERKS.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur">
                <Icon className="h-4 w-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Form */}
      <div className="p-6 sm:p-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {mode === "login" ? "Log in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {mode === "login"
            ? "Get tickets and see your passes."
            : "It takes 30 seconds. Then grab your first ticket to OOU events."}
        </p>

        {googleEnabled && (
          <>
            {/* Plain link (not fetch): the browser must navigate to Google. */}
            <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="btn-ghost mt-6 w-full py-3">
              <GoogleIcon />
              Continue with Google
            </a>
            <div className="my-5 flex items-center gap-3 text-xs uppercase text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200" />
              or with email
              <span className="h-px flex-1 bg-zinc-200" />
            </div>
          </>
        )}

        <form onSubmit={onSubmit} className={`${googleEnabled ? "" : "mt-6 "}space-y-4`}>
          {mode === "signup" && (
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" name="name" required autoComplete="name" className="input" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : 1}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="input"
            />
          </div>
          {error && <p className="animate-pop rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Please wait…
              </>
            ) : mode === "login" ? (
              "Log in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-600 hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-600 hover:underline">
                Log in
              </Link>
            </>
          )}
        </p>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Want to sell tickets for your event?{" "}
          <Link href="/organizers/apply" className="font-semibold text-brand-600 hover:underline">
            Apply to be an organizer
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
