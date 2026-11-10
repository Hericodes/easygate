"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { resizeImage } from "@/lib/resize-image";
import Avatar from "./Avatar";
import { CameraIcon, ImagePlusIcon, TrashIcon } from "./icons";

/** The large profile photo with a camera button to upload, change or remove it. */
export default function AvatarUpload({ name, src }: { name: string; src: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(src);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setCurrent(src), [src]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const blob = await resizeImage(file, { maxSize: 512, square: true });
      const body = new FormData();
      body.append("file", blob, blob.type === "image/webp" ? "photo.webp" : "photo.jpg");
      const res = await fetch("/api/account/avatar", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed. Try again");
      setCurrent(data.avatarUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setMenu(false);
    setError("");
    setBusy(true);
    const res = await fetch("/api/account/avatar", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setError("Couldn't remove the photo. Try again");
    setCurrent(null);
    router.refresh();
  }

  function pick() {
    setMenu(false);
    input.current?.click();
  }

  return (
    <div ref={menuRef} className="relative w-fit shrink-0">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <div className="w-fit rounded-full p-1 shadow-[0_18px_40px_-16px_rgb(59_7_100/0.55)] [background:linear-gradient(135deg,#a855f7,#6415f5_45%,#ec4899)]">
        <div className="relative flex rounded-full bg-white p-0.5">
          <Avatar name={name} src={current} size="xl" />
          {busy && (
            <span className="absolute inset-0.5 grid place-items-center rounded-full bg-[#0b0420]/55">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => (current ? setMenu((m) => !m) : pick())}
        disabled={busy}
        aria-label={current ? "Change or remove profile photo" : "Add a profile photo"}
        aria-expanded={current ? menu : undefined}
        className="primary-gradient absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full text-white shadow-lg shadow-brand-700/40 ring-4 ring-white transition hover:scale-105 active:scale-95 disabled:opacity-60"
      >
        <CameraIcon className="h-[18px] w-[18px]" />
      </button>

      {menu && (
        <div className="animate-fade-up absolute left-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_20px_50px_-16px_rgb(23_21_43/0.35)] ring-1 ring-line">
          <button type="button" onClick={pick} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-brand-50">
            <ImagePlusIcon className="h-4 w-4 text-brand-600" /> Change photo
          </button>
          <button type="button" onClick={remove} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
            <TrashIcon className="h-4 w-4" /> Remove photo
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="absolute left-0 top-full z-10 mt-2 w-60 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
