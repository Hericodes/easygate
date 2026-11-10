"use client";

/* eslint-disable @next/next/no-img-element -- uploads are already resized */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExpandIcon, XIcon } from "./icons";

/** The event page's flyer as a poster. Tap it to see it full screen. */
export default function FlyerViewer({ src, title }: { src: string; title: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View the ${title} flyer full screen`}
        className="group relative flex h-full w-full items-center justify-center"
      >
        <img
          src={src}
          alt={`${title} flyer`}
          fetchPriority="high"
          className="min-h-0 min-w-0 max-h-full max-w-full rounded-[20px] object-contain shadow-[0_30px_60px_-20px_rgb(0_0_0/0.7)] ring-1 ring-white/25 transition duration-300 [@media(hover:hover)]:group-hover:scale-[1.015]"
        />
        <span className="absolute -bottom-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
          <ExpandIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> View flyer
        </span>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} flyer`}
            className="animate-fade-in fixed inset-0 z-[80] flex items-center justify-center bg-[#07020f]/95 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <img
              src={src}
              alt={`${title} flyer`}
              className="max-h-[calc(100dvh-6rem)] max-w-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 transition hover:bg-white/25 active:scale-95"
            >
              <XIcon className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
