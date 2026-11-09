import Link from "next/link";
import { LockIcon, TicketIcon } from "./icons";
import { naira } from "@/lib/format";

type Option = { id: string; name: string; priceKobo: number; quantity: number; sold: number };

/** The ticket types for an event, each with price, availability and a Select button into checkout. */
export default function TicketOptions({
  slug,
  ticketTypes,
  loggedIn,
}: {
  slug: string;
  ticketTypes: Option[];
  loggedIn: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 pb-3 pt-5">
        <h2 className="text-lg font-extrabold">Tickets</h2>
        <p className="text-sm text-muted">Choose a ticket type to continue.</p>
      </div>

      <ul className="space-y-2.5 px-3 pb-3">
        {ticketTypes.map((t) => {
          const left = Math.max(0, t.quantity - t.sold);
          const soldOut = left === 0;
          const checkout = `/events/${slug}/checkout?type=${t.id}`;
          const href = loggedIn ? checkout : `/login?next=${encodeURIComponent(checkout)}`;
          return (
            <li key={t.id}>
              <div
                className={`flex items-center gap-3 rounded-2xl border p-3.5 transition ${
                  soldOut ? "border-line bg-zinc-50 opacity-60" : "border-line bg-white hover:border-brand-200"
                }`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <TicketIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{t.name}</p>
                  <p className={`text-xs font-medium ${!soldOut && left <= 20 ? "text-orange-600" : "text-muted"}`}>
                    {soldOut ? "Sold out" : left <= 20 ? `Only ${left} left` : `${left.toLocaleString()} available`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="font-extrabold text-ink">{naira(t.priceKobo)}</p>
                  {!soldOut && (
                    <Link href={href} className="btn-primary h-8 px-4 text-xs">
                      Select
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="flex items-center justify-center gap-1.5 border-t border-line px-5 py-3.5 text-center text-xs text-muted">
        <LockIcon className="h-3.5 w-3.5 shrink-0" /> Secure checkout with Paystack · QR ticket instantly
      </p>
    </div>
  );
}
