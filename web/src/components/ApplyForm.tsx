"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ApplyForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/organizer-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) return setError(body.error);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="orgName">Club / association / brand name</label>
        <input id="orgName" name="orgName" required className="input" placeholder="e.g. OOU Law Students' Society" />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone (WhatsApp)</label>
        <input id="phone" name="phone" type="tel" required className="input" placeholder="0803 123 4567" />
      </div>
      <div>
        <label className="label" htmlFor="eventTypes">What events will you host?</label>
        <input id="eventTypes" name="eventTypes" required className="input" placeholder="e.g. Faculty dinner, departmental week, parties" />
      </div>
      <div>
        <label className="label" htmlFor="socialHandle">Instagram / X handle (optional)</label>
        <input id="socialHandle" name="socialHandle" className="input" placeholder="@yourhandle" />
      </div>
      <div>
        <label className="label" htmlFor="message">Anything else? (optional)</label>
        <textarea id="message" name="message" rows={3} className="input" placeholder="Past events you've organized, who you are…" />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="btn-primary w-full">
        {loading ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
