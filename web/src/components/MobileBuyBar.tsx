"use client";

import { useEffect, useState } from "react";

/**
 * Phone-only bar pinned above the tab bar on event pages: price + "Get tickets".
 * It hides itself while the ticket box (targetId) is on screen.
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
      className={`fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 px-3 pb-2 transition duration-300 sm:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink/95 p-2 pl-4 text-white shadow-2xl shadow-brand-900/40 backdrop-blur">
        <div>
          <p className="text-[11px] font-medium text-white/60">Tickets</p>
          <p className="font-display text-lg font-bold leading-tight">{label}</p>
        </div>
        <a href={`#${targetId}`} className="btn-primary px-5 py-3">
          Get tickets
        </a>
      </div>
    </div>
  );
}
