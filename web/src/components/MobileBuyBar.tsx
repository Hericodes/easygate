"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon } from "./icons";

/**
 * Phone-only bar pinned above the tab bar on event pages: price + "Get tickets".
 * It hides itself while the ticket list (targetId) is on screen.
 */
export default function MobileBuyBar({ targetId, label }: { targetId: string; label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-[calc(5.6rem+env(safe-area-inset-bottom))] z-20 px-3 transition duration-300 sm:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between gap-3 rounded-full bg-white p-1.5 pl-5 shadow-[0_16px_40px_-14px_rgb(59_7_100/0.45)] ring-1 ring-line">
        <div>
          <p className="text-[11px] font-semibold text-muted">Tickets</p>
          <p className="text-[15px] font-extrabold leading-tight text-ink">{label}</p>
        </div>
        <a href={`#${targetId}`} className="btn-primary h-11 px-5">
          Get tickets <ArrowRightIcon className="h-4 w-4" strokeWidth={2.4} />
        </a>
      </div>
    </div>
  );
}
