"use client";

import { useEffect, useState } from "react";

/** Live "starts in" countdown for an event, or a live/ended pill. */
export default function Countdown({ startsAt, endsAt }: { startsAt: string; endsAt: string | null }) {
  // Rendered only after mount so server and browser clocks can't disagree.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (now === null) return <div className="h-14" aria-hidden />;

  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : start + 6 * 3600e3;
  if (now >= end) return <Pill>Event ended</Pill>;
  if (now >= start) return <Pill live>Happening now</Pill>;

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

  return (
    <div
      role="timer"
      aria-label={`Starts in ${days} days, ${hours} hours and ${mins} minutes`}
      className="flex gap-2"
    >
      {units.map(([value, label]) => (
        <div
          key={label}
          className="min-w-14 rounded-2xl bg-white/15 px-2.5 py-2 text-center ring-1 ring-white/25 backdrop-blur-md"
        >
          <p className="font-display text-xl font-bold leading-none tabular-nums sm:text-2xl">
            {String(value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">{label}</p>
        </div>
      ))}
    </div>
  );
}

function Pill({ children, live }: { children: React.ReactNode; live?: boolean }) {
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur-md">
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
