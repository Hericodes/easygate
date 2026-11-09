"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SEEN = "eg_notif_seen";
const PREV = "eg_notif_prev";

/**
 * Marks notifications as seen when the notifications page opens, then refreshes so the
 * header bell clears. The previous "seen" time is kept briefly so this visit can still
 * highlight which notifications were new.
 */
export default function MarkSeen({ seenAt }: { seenAt: number }) {
  const router = useRouter();
  useEffect(() => {
    if (Date.now() - seenAt < 60_000) return; // already marked on this visit
    const year = 60 * 60 * 24 * 365;
    document.cookie = `${PREV}=${seenAt}; path=/; max-age=${year}; samesite=lax`;
    document.cookie = `${SEEN}=${Date.now()}; path=/; max-age=${year}; samesite=lax`;
    router.refresh();
  }, [seenAt, router]);
  return null;
}
