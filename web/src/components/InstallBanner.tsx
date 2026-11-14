"use client";

import { useEffect, useState } from "react";
import { IosShareIcon, TicketIcon, XIcon } from "./icons";

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

const KEY = "eg-install-dismissed";
const QUIET_DAYS = 14;

/**
 * Phone-only "Install Jiivent" card. Android/Chrome gets an Install button;
 * iPhone Safari gets the Add to Home Screen steps. Hidden once installed or dismissed.
 */
export default function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    try {
      const dismissedAt = Number(localStorage.getItem(KEY));
      if (dismissedAt && Date.now() - dismissedAt < QUIET_DAYS * 864e5) return;
    } catch {
      /* storage blocked: still show */
    }

    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the browser's own mini-bar from showing; we show ours
      setPromptEvent(e as InstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ua = navigator.userAgent;
    if (/iphone|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua)) {
      setIos(true);
      setShow(true);
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    setPromptEvent(null);
    setShow(false);
  }

  if (!show) return null;
  return (
    <div className="animate-pop fixed inset-x-3 bottom-[calc(5.6rem+env(safe-area-inset-bottom))] z-40 sm:hidden">
      <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-2xl ring-1 ring-zinc-200">
        <span className="brand-gradient grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-md shadow-brand-500/30">
          <TicketIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Get the Jiivent app</p>
          {ios ? (
            <p className="mt-0.5 text-sm text-zinc-500">
              Tap <IosShareIcon className="inline h-4 w-4 align-text-bottom text-brand-600" /> then{" "}
              <strong className="text-ink">Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-zinc-500">Your tickets, one tap away. No app store needed.</p>
          )}
          {!ios && (
            <button type="button" onClick={install} className="btn-primary mt-3 py-2">
              Install
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-zinc-400 transition active:scale-90"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
