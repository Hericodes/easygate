"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "./icons";

/** A ticket's QR code. Tapping it opens a big, full-screen version for scanning at the gate. */
export default function TicketQr({
  src,
  code,
  title,
  usedLabel,
  size = "md",
}: {
  src: string;
  code: string;
  title: string;
  /** When set, the ticket was already scanned (shown as a "Used" stamp). */
  usedLabel?: string;
  size?: "md" | "lg";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Show QR code for ticket ${code} full screen`}
        className="relative mx-auto block rounded-2xl p-1 transition active:scale-[0.97]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`QR code for ticket ${code}`}
          className={`rounded-xl [image-rendering:pixelated] ${size === "lg" ? "h-60 w-60" : "h-44 w-44"}`}
        />
        {usedLabel ? (
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-xl border-4 border-red-500/80 bg-white/80 px-4 py-1 text-center font-display font-black uppercase text-red-500/90">
            <span className="block text-2xl leading-tight tracking-widest">Used</span>
            <span className="block whitespace-nowrap text-[10px] font-bold tracking-wider">{usedLabel}</span>
          </span>
        ) : (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-semibold text-white">
            Tap to enlarge
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Ticket ${code}`}
            onClick={() => setOpen(false)}
            className="animate-fade-in fixed inset-0 z-50 grid place-items-center bg-ink/90 p-5 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="animate-pop w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
            >
              <p className="font-display text-lg font-bold leading-snug">{title}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`QR code for ticket ${code}`}
                className="mx-auto mt-4 aspect-square w-full max-w-72 [image-rendering:pixelated]"
              />
              <p className="mt-4 font-mono text-lg font-bold tracking-[0.2em]">{code}</p>
              <p className="mt-2 text-sm text-zinc-500">
                {usedLabel ? "This ticket has already been used." : "Turn your screen brightness up for a faster scan."}
              </p>
              <button type="button" autoFocus onClick={() => setOpen(false)} className="btn-ghost mt-5 w-full py-3">
                <XIcon className="h-4 w-4" /> Close
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
