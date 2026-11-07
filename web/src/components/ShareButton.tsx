"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "./icons";

/** Opens the phone's share sheet (WhatsApp, Instagram, …); copies the link where that isn't available. */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} on EasyGate`, url });
      } catch {
        /* the user closed the share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-white/20 px-4 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur-md transition active:scale-95 [@media(hover:hover)]:hover:bg-white/30"
    >
      {copied ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
