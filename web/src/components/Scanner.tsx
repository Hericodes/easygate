"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertIcon, CheckIcon, ScanIcon, XIcon } from "./icons";

type Result = {
  result: "VALID" | "ALREADY_USED" | "WRONG_EVENT" | "NOT_FOUND";
  code: string;
  holder?: string;
  ticketType?: string;
  checkedInAt?: string;
};

const RESULTS: Record<
  Result["result"],
  { gradient: string; title: string; sub: string; Icon: (p: { className?: string }) => React.ReactElement }
> = {
  VALID: { gradient: "from-emerald-500 to-teal-500", title: "Valid: let them in", sub: "Checked in", Icon: CheckIcon },
  ALREADY_USED: { gradient: "from-amber-400 to-orange-500", title: "Already used", sub: "This ticket was scanned before", Icon: AlertIcon },
  WRONG_EVENT: { gradient: "from-rose-500 to-red-600", title: "Wrong event", sub: "This ticket is for another event", Icon: XIcon },
  NOT_FOUND: { gradient: "from-rose-500 to-red-600", title: "Invalid ticket", sub: "No ticket has this code", Icon: XIcon },
};

export default function Scanner({ eventId }: { eventId: string }) {
  const [last, setLast] = useState<Result | null>(null);
  const [seq, setSeq] = useState(0); // re-triggers the result animation for every scan
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);
  const busy = useRef(false);
  const lastCode = useRef<{ code: string; at: number } | null>(null);

  const check = useCallback(
    async (code: string) => {
      // Ignore the same code being re-read by the camera for a few seconds.
      const now = Date.now();
      if (busy.current) return;
      if (lastCode.current?.code === code && now - lastCode.current.at < 4000) return;
      busy.current = true;
      lastCode.current = { code, at: now };
      setError("");
      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, code }),
        });
        const body = await res.json();
        if (!res.ok) setError(body.error);
        else {
          setLast(body);
          setSeq((s) => s + 1);
          navigator.vibrate?.(body.result === "VALID" ? 80 : [80, 60, 80]);
        }
      } catch {
        setError("Network error. Check your connection.");
      } finally {
        busy.current = false;
      }
    },
    [eventId],
  );

  useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      scanner = new Html5Qrcode("eg-reader");
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => check(text.trim().toUpperCase()),
          () => {},
        );
        if (!cancelled) setScanning(true);
      } catch {
        setCameraError("Camera unavailable. Allow camera access, or type ticket codes below.");
      }
    })();
    return () => {
      cancelled = true;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
  }, [check]);

  const r = last ? RESULTS[last.result] : null;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-ink shadow-xl shadow-brand-900/20">
        <div id="eg-reader" className="min-h-64" />
        {scanning && (
          <div
            aria-hidden
            className="animate-scan pointer-events-none absolute inset-x-8 h-0.5 rounded-full bg-accent shadow-[0_0_18px_4px_rgb(198_244_50/0.55)]"
          />
        )}
        {!scanning && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-zinc-400">
            <div>
              <ScanIcon className="mx-auto mb-3 h-10 w-10 text-zinc-500" />
              {cameraError || "Starting camera…"}
            </div>
          </div>
        )}
      </div>

      {last && r && (
        <div key={seq} className={`animate-pop flex items-center gap-4 rounded-3xl bg-linear-to-br p-5 text-white shadow-lg ${r.gradient}`}>
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20">
            <r.Icon className="h-8 w-8" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold leading-tight">{r.title}</p>
            <p className="text-sm text-white/90">{last.holder ? `${last.holder} · ${last.ticketType}` : r.sub}</p>
            {last.checkedInAt && (
              <p className="text-xs text-white/85">First scanned at {new Date(last.checkedInAt).toLocaleTimeString()}</p>
            )}
            <p className="mt-0.5 font-mono text-xs text-white/75">{last.code}</p>
          </div>
        </div>
      )}
      {error && <p className="animate-pop rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) {
            lastCode.current = null;
            check(manual.trim().toUpperCase());
            setManual("");
          }
        }}
      >
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="JV-XXXXXXXXXX"
          aria-label="Ticket code"
          className="input font-mono uppercase"
        />
        <button className="btn-primary">Check</button>
      </form>
    </div>
  );
}
