"use client";

import { useRef, useState } from "react";
import { resizeImage } from "@/lib/resize-image";
import FlyerImage from "./FlyerImage";
import { AlertIcon, CheckIcon, ImagePlusIcon, TrashIcon } from "./icons";

/**
 * Pick or drop the event flyer. It's resized in the browser and uploaded straight away;
 * the uploaded address goes in a hidden `imageUrl` field for the form.
 * `onBusy` tells the form to wait while an upload is running.
 */
export default function FlyerUpload({ onBusy }: { onBusy?: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  function setWorking(value: boolean) {
    setBusy(value);
    onBusy?.(value);
  }

  async function upload(file: File | undefined) {
    if (!file || busy) return;
    setError("");
    setWorking(true);
    try {
      const blob = await resizeImage(file, { maxSize: 1600 });
      const local = URL.createObjectURL(blob);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return local;
      });
      const body = new FormData();
      body.append("file", blob, blob.type === "image/webp" ? "flyer.webp" : "flyer.jpg");
      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed. Try again");
      setUrl(data.url);
    } catch (err) {
      setUrl("");
      setPreview("");
      setError(err instanceof Error ? err.message : "Upload failed. Try again");
    } finally {
      setWorking(false);
      if (input.current) input.current.value = "";
    }
  }

  function remove() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setUrl("");
    setError("");
  }

  const shown = preview || url;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <input type="hidden" name="imageUrl" value={url} />
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files?.[0]);
        }}
        disabled={busy}
        aria-label={shown ? "Change flyer" : "Upload flyer"}
        className={`group relative mx-auto aspect-[4/5] w-full max-w-[210px] shrink-0 overflow-hidden rounded-[22px] transition sm:mx-0 sm:w-48 ${
          shown
            ? "shadow-[0_20px_40px_-20px_rgb(59_7_100/0.5)] ring-1 ring-line"
            : `border-2 border-dashed ${dragging ? "border-brand-500 bg-brand-50" : "border-brand-200 bg-page hover:border-brand-400 hover:bg-brand-50/60"}`
        }`}
      >
        {shown ? (
          <>
            <FlyerImage src={shown} alt="Your flyer" eager />
            {!busy && (
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                Change flyer
              </span>
            )}
          </>
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="primary-gradient grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg shadow-brand-600/30 transition group-hover:scale-105">
              <ImagePlusIcon className="h-7 w-7" />
            </span>
            <span className="mt-1 text-sm font-bold text-ink">Upload flyer</span>
            <span className="text-xs text-muted">
              Tap to choose<span className="hidden sm:inline"> or drop it here</span>
            </span>
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-[#0b0420]/55 backdrop-blur-[2px]">
            <span className="flex flex-col items-center gap-2 text-xs font-semibold text-white">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
              Uploading…
            </span>
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1 space-y-3">
        <ul className="space-y-1.5 text-sm text-muted">
          <Tip>Portrait (4:5) looks best, e.g. 1080 × 1350</Tip>
          <Tip>JPG, PNG or WebP. Large photos are shrunk for you</Tip>
          <Tip>Students see the whole flyer on the event card and page</Tip>
        </ul>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}
        {url && !busy && (
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckIcon className="h-4 w-4" strokeWidth={2.6} /> Flyer uploaded
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-soft h-10 px-4 text-sm">
            <ImagePlusIcon className="h-4 w-4" /> {shown ? "Change flyer" : "Choose picture"}
          </button>
          {shown && !busy && (
            <button type="button" onClick={remove} className="btn-ghost h-10 px-4 text-sm text-red-600">
              <TrashIcon className="h-4 w-4" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" strokeWidth={2.6} />
      <span>{children}</span>
    </li>
  );
}
