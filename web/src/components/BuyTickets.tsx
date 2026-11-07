"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { naira } from "@/lib/format";
import { CheckIcon, FlameIcon, LockIcon, MinusIcon, PlusIcon, TicketIcon } from "./icons";

type TT = { id: string; name: string; priceKobo: number; left: number };

export default function BuyTickets({
  ticketTypes,
  loggedIn,
  slug,
}: {
  ticketTypes: TT[];
  loggedIn: boolean;
  slug: string;
}) {
  const router = useRouter();
  const firstAvailable = ticketTypes.find((t) => t.left > 0);
  const [selected, setSelected] = useState(firstAvailable?.id ?? "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tt = ticketTypes.find((t) => t.id === selected);
  const maxQty = Math.min(10, tt?.left ?? 0);
  const total = (tt?.priceKobo ?? 0) * qty;
  const minPrice = ticketTypes.length ? Math.min(...ticketTypes.map((t) => t.priceKobo)) : 0;

  async function buy() {
    if (!loggedIn) return router.push(`/login?next=/events/${slug}`);
    setError("");
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketTypeId: selected, quantity: qty }),
    });
    const body = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setError(body.error);
    }
    window.location.href = body.redirectUrl;
  }

  return (
    <div className="card overflow-hidden">
      <div className="brand-gradient animated-gradient relative overflow-hidden px-5 py-4 text-white">
        <TicketIcon strokeWidth={1.5} className="absolute -right-3 -top-3 h-24 w-24 rotate-12 text-white/20" />
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Get tickets</p>
        <p className="font-display text-2xl font-bold">{minPrice === 0 ? "Free entry" : `From ${naira(minPrice)}`}</p>
      </div>

      <div className="p-5">
        <div role="radiogroup" aria-label="Ticket type" className="space-y-2.5">
          {ticketTypes.map((t) => {
            const soldOut = t.left <= 0;
            const active = selected === t.id;
            return (
              <label
                key={t.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border-2 p-3.5 transition duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-300 ${
                  active
                    ? "border-brand-500 bg-brand-50/70 shadow-[0_10px_24px_-14px_rgb(109_74_255/0.7)]"
                    : "border-zinc-200 hover:border-brand-200"
                } ${soldOut ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <input
                  type="radio"
                  name="tt"
                  className="sr-only"
                  disabled={soldOut}
                  checked={active}
                  onChange={() => {
                    setSelected(t.id);
                    setQty(1);
                  }}
                />
                <span className="flex items-center gap-3">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition duration-200 ${
                      active ? "brand-gradient border-transparent text-white" : "border-zinc-300"
                    }`}
                  >
                    {active && <CheckIcon className="animate-pop h-3.5 w-3.5" />}
                  </span>
                  <span>
                    <span className="block font-semibold">{t.name}</span>
                    {!soldOut && t.left <= 20 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                        <FlameIcon className="h-3 w-3" /> Only {t.left} left
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">{soldOut ? "Sold out" : "Available"}</span>
                    )}
                  </span>
                </span>
                <span className="font-display text-lg font-bold">{naira(t.priceKobo)}</span>
              </label>
            );
          })}
        </div>

        {tt && (
          <>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-zinc-50 p-2 pl-4">
              <span className="text-sm font-semibold">Quantity</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Fewer tickets"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 transition hover:ring-brand-300 active:scale-90 disabled:opacity-40 disabled:active:scale-100"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span key={qty} aria-live="polite" className="animate-pop w-9 text-center font-display text-lg font-bold">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="More tickets"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 transition hover:ring-brand-300 active:scale-90 disabled:opacity-40 disabled:active:scale-100"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-dashed border-zinc-200 pt-4">
              <span className="text-sm text-zinc-500">Total</span>
              <span key={total} className="animate-pop font-display text-3xl font-bold tracking-tight">
                {naira(total)}
              </span>
            </div>
          </>
        )}

        {error && <p className="animate-pop mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button onClick={buy} disabled={!tt || loading} className="btn-primary mt-4 w-full py-3.5 text-base">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Please wait…
            </>
          ) : !tt ? (
            "Sold out"
          ) : !loggedIn ? (
            "Log in to get tickets"
          ) : total === 0 ? (
            <>
              <TicketIcon className="h-4 w-4" />
              Get free ticket
            </>
          ) : (
            <>
              <LockIcon className="h-4 w-4" />
              Pay {naira(total)}
            </>
          )}
        </button>
        <p className="mt-3 text-center text-xs text-zinc-500">
          {total > 0
            ? "Secured by Paystack · Card, transfer or USSD"
            : "Your QR ticket appears in “My tickets” instantly."}
        </p>
      </div>
    </div>
  );
}
