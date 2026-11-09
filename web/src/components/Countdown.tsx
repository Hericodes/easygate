"use client";

import { useEffect, useState } from "react";

/** Live "starts in" countdown for an event, or a live/ended pill. `tone` matches the background. */
export default function Countdown({
  startsAt,
  endsAt,
  tone = "light",
}: {
  startsAt: string;
  endsAt: string | null;
  tone?: "light" | "dark";
}) {
  // Rendered only after mount so server and browser clocks can't disagree.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (now === null) return <div className="h-[58px]" aria-hidden />;

  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : start + 6 * 3600e3;
  if (now >= end) return <Pill tone={tone}>This event has ended</Pill>;
  if (now >= start) return <Pill tone={tone} live>Happening now</Pill>;

  let s = Math.floor((start - now) / 1000);
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hours = Math.floor(s / 3600);
  s -= hours * 3600;
  const mins = Math.floor(s / 60);
  const secs = s - mins * 60;
  const units = [
    [days, "days"],
    [hours, "hrs"],
    [mins, "min"],
    [secs, "sec"],
  ] as const;

  const box =
    tone === "dark"
      ? "bg-white/15 text-white ring-white/25 backdrop-blur-md"
      : "bg-brand-50 text-brand-700 ring-brand-100";
  const label = tone === "dark" ? "text-white/75" : "text-muted";

  return (
    <div role="timer" aria-label={`Starts in ${days} days, ${hours} hours and ${mins} minutes`} className="flex gap-2">
      {units.map(([value, unit]) => (
        <div key={unit} className={`min-w-[3.4rem] rounded-2xl px-2 py-2 text-center ring-1 ${box}`}>
          <p className="text-xl font-extrabold leading-none tabular-nums">{String(value).padStart(2, "0")}</p>
          <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${label}`}>{unit}</p>
        </div>
      ))}
    </div>
  );
}

function Pill({ children, live, tone }: { children: React.ReactNode; live?: boolean; tone: "light" | "dark" }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ${
        tone === "dark" ? "bg-white/20 text-white backdrop-blur-md" : "bg-brand-50 text-brand-700"
      }`}
    >
      {live && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      )}
      {children}
    </span>
  );
}
