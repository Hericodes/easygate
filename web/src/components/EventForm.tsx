"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/format";
import FlyerUpload from "./FlyerUpload";
import { XIcon } from "./icons";

type TT = { name: string; priceNaira: string; quantity: string };

/** `autoApprove`: admins' events go live straight away; everyone else's wait for review. */
export default function EventForm({ autoApprove = false }: { autoApprove?: boolean }) {
  const router = useRouter();
  const [ticketTypes, setTicketTypes] = useState<TT[]>([
    { name: "Regular", priceNaira: "2000", quantity: "100" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  function updateTT(i: number, patch: Partial<TT>) {
    setTicketTypes((list) => list.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploading) return;
    setError("");
    setLoading(true);
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...f,
        // datetime-local has no timezone; convert using the organizer's browser timezone.
        startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : "",
        endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : undefined,
        ticketTypes,
      }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) return setError(body.error);
    router.push(`/organizer/events/${body.event.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-5 sm:p-6">
        <h2 className="font-bold">Event flyer</h2>
        <p className="mb-4 mt-0.5 text-sm text-muted">Optional. Without one, your event gets a cover in its type&apos;s colours.</p>
        <FlyerUpload onBusy={setUploading} />
      </section>

      <section className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="title">Event name</label>
          <input id="title" name="title" required className="input" placeholder="e.g. Freshers' Night 2026" />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" required rows={5} className="input" placeholder="What should guests expect? Dress code, lineup, rules…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">Type</label>
            <select id="category" name="category" className="input">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="venue">Venue</label>
            <input id="venue" name="venue" required className="input" placeholder="e.g. OOU Main Auditorium, Ago-Iwoye" />
          </div>
          <div>
            <label className="label" htmlFor="startsAt">Starts</label>
            <input id="startsAt" name="startsAt" type="datetime-local" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="endsAt">Ends (optional)</label>
            <input id="endsAt" name="endsAt" type="datetime-local" className="input" />
          </div>
        </div>
      </section>

      <section className="card space-y-3 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Ticket types</h2>
          <button
            type="button"
            className="btn-ghost py-1.5"
            onClick={() => setTicketTypes((l) => [...l, { name: "VIP", priceNaira: "5000", quantity: "20" }])}
          >
            + Add type
          </button>
        </div>
        <p className="text-sm text-zinc-500">Set price to 0 for free tickets.</p>
        {ticketTypes.map((t, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-2xl border border-zinc-100 p-3 sm:grid-cols-[1fr_110px_90px_auto] sm:rounded-none sm:border-0 sm:p-0"
          >
            {/* On phones every row shows its labels; on wider screens only the first row does. */}
            <div className="col-span-3 sm:col-span-1">
              <span className={`label ${i === 0 ? "" : "sm:hidden"}`}>Name</span>
              <input className="input" value={t.name} required onChange={(e) => updateTT(i, { name: e.target.value })} />
            </div>
            <div>
              <span className={`label ${i === 0 ? "" : "sm:hidden"}`}>Price (₦)</span>
              <input className="input" type="number" inputMode="numeric" min={0} value={t.priceNaira} required onChange={(e) => updateTT(i, { priceNaira: e.target.value })} />
            </div>
            <div>
              <span className={`label ${i === 0 ? "" : "sm:hidden"}`}>Qty</span>
              <input className="input" type="number" inputMode="numeric" min={1} value={t.quantity} required onChange={(e) => updateTT(i, { quantity: e.target.value })} />
            </div>
            <button
              type="button"
              aria-label="Remove ticket type"
              disabled={ticketTypes.length === 1}
              onClick={() => setTicketTypes((l) => l.filter((_, j) => j !== i))}
              className="btn-ghost h-[46px] px-3 sm:h-[42px]"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </section>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={loading || uploading} className="btn-primary w-full py-3">
        {uploading ? "Waiting for the flyer…" : loading ? "Submitting…" : autoApprove ? "Publish event" : "Submit event for review"}
      </button>
    </form>
  );
}
