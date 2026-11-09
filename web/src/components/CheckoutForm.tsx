"use client";

import { useState } from "react";
import { CheckIcon, LockIcon, MinusIcon, PlusIcon, QrIcon, SmartphoneIcon, TicketIcon } from "./icons";
import { money, naira } from "@/lib/format";

type TT = { id: string; name: string; priceKobo: number; left: number };

/** Ticket type, quantity and price breakdown, then hands off to the existing order + Paystack flow. */
export default function CheckoutForm({
  ticketTypes,
  initialTypeId,
  initialQty,
  email,
}: {
  ticketTypes: TT[];
  initialTypeId: string;
  initialQty: number;
  email: string;
}) {
  const [typeId, setTypeId] = useState(initialTypeId);
  const [qty, setQty] = useState(initialQty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tt = ticketTypes.find((t) => t.id === typeId) ?? ticketTypes[0];
  const maxQty = Math.max(1, Math.min(10, tt.left));
  const subtotal = tt.priceKobo * qty;
  const free = subtotal === 0;

  async function pay() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketTypeId: tt.id, quantity: qty }),
    });
    const body = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setError(body.error ?? "Something went wrong. Please try again.");
    }
    window.location.href = body.redirectUrl; // Paystack, or straight to your tickets for free events
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Ticket type</h2>
          <div role="radiogroup" aria-label="Ticket type" className="mt-3 space-y-2.5">
            {ticketTypes.map((t) => {
              const soldOut = t.left <= 0;
              const active = t.id === tt.id;
              return (
                <label
                  key={t.id}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 transition has-focus-visible:ring-2 has-focus-visible:ring-brand-300 ${
                    active ? "border-brand-500 bg-brand-50/60" : "border-line hover:border-brand-200"
                  } ${soldOut ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name="ticketType"
                    className="sr-only"
                    disabled={soldOut}
                    checked={active}
                    onChange={() => {
                      setTypeId(t.id);
                      setQty(1);
                    }}
                  />
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
                      active ? "primary-gradient border-transparent text-white" : "border-zinc-300"
                    }`}
                  >
                    {active && <CheckIcon className="animate-pop h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-ink">{t.name}</span>
                    <span className={`text-xs font-medium ${!soldOut && t.left <= 20 ? "text-orange-600" : "text-muted"}`}>
                      {soldOut ? "Sold out" : t.left <= 20 ? `Only ${t.left} left` : `${t.left.toLocaleString()} available`}
                    </span>
                  </span>
                  <span className="font-extrabold text-ink">{naira(t.priceKobo)}</span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="card flex items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-extrabold">Quantity</h2>
            <p className="text-xs text-muted">Up to {maxQty} per order</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-page p-1.5 ring-1 ring-line">
            <button
              type="button"
              aria-label="Fewer tickets"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-line transition active:scale-90 disabled:opacity-40"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span key={qty} aria-live="polite" className="animate-pop w-9 text-center text-lg font-extrabold">
              {qty}
            </span>
            <button
              type="button"
              aria-label="More tickets"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              className="primary-gradient grid h-10 w-10 place-items-center rounded-full text-white shadow-md transition active:scale-90 disabled:opacity-40"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card overflow-hidden">
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">
                  {qty} × {tt.name}
                </dt>
                <dd className="font-semibold text-ink">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Service fee</dt>
                <dd className="font-semibold text-emerald-600">Free</dd>
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-dashed border-line pt-4">
                <dt className="font-bold text-ink">Total</dt>
                <dd key={subtotal} className="animate-pop text-2xl font-extrabold tracking-tight text-ink">
                  {money(subtotal)}
                </dd>
              </div>
            </dl>

            {error && <p className="animate-pop mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <button onClick={pay} disabled={loading || tt.left <= 0} className="btn-primary mt-5 w-full py-3.5 text-base">
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Please wait…
                </>
              ) : free ? (
                <>
                  <TicketIcon className="h-4 w-4" /> Get {qty > 1 ? `${qty} free tickets` : "free ticket"}
                </>
              ) : (
                <>
                  <LockIcon className="h-4 w-4" /> Pay {money(subtotal)} with Paystack
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              Ordering as <span className="font-semibold text-ink">{email}</span>
            </p>
          </div>
          <ul className="space-y-2.5 border-t border-line bg-page px-5 py-4 text-xs text-muted sm:px-6">
            <li className="flex items-center gap-2.5">
              <LockIcon className="h-4 w-4 shrink-0 text-brand-600" /> Payments are processed securely by Paystack
            </li>
            <li className="flex items-center gap-2.5">
              <SmartphoneIcon className="h-4 w-4 shrink-0 text-brand-600" /> Pay with card, bank transfer or USSD
            </li>
            <li className="flex items-center gap-2.5">
              <QrIcon className="h-4 w-4 shrink-0 text-brand-600" /> Your QR ticket appears in My Tickets right after
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
