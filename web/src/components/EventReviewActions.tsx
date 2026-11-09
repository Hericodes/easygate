"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckIcon, XIcon } from "./icons";

/** Approve / reject (or take down) an event, with an optional reason shown to the organizer. */
export default function EventReviewActions({ id, status, sold }: { id: string; status: string; sold: number }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(action: "APPROVE" | "REJECT") {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/events/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: note.trim() || undefined }),
    });
    setLoading(false);
    if (!res.ok) return setError((await res.json()).error ?? "Something went wrong");
    setRejecting(false);
    setNote("");
    router.refresh();
  }

  if (rejecting) {
    return (
      <div className="w-full space-y-2">
        {status === "APPROVED" && sold > 0 && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {sold} ticket{sold === 1 ? " has" : "s have"} been sold. Taking the event down hides it from students; contact
            the buyers about refunds.
          </p>
        )}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          placeholder="Reason (shown to the organizer)"
          aria-label="Reason"
          className="input"
          autoFocus
        />
        <div className="flex gap-2">
          <button type="button" disabled={loading} onClick={() => send("REJECT")} className="btn bg-red-600 text-white hover:bg-red-700">
            {status === "APPROVED" ? "Take down" : "Reject"}
          </button>
          <button type="button" disabled={loading} onClick={() => setRejecting(false)} className="btn-ghost">
            Cancel
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "APPROVED" && (
        <button type="button" disabled={loading} onClick={() => send("APPROVE")} className="btn-primary">
          <CheckIcon className="h-4 w-4" strokeWidth={2.6} /> Approve
        </button>
      )}
      <button type="button" disabled={loading} onClick={() => setRejecting(true)} className="btn-ghost text-red-600">
        <XIcon className="h-4 w-4" /> {status === "APPROVED" ? "Take down" : status === "REJECTED" ? "Update reason" : "Reject"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
