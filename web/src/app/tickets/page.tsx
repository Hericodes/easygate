import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserTickets } from "@/lib/user-tickets";
import { categoryMeta, dateParts, eventDate } from "@/lib/format";
import CategoryIcon from "@/components/CategoryIcon";
import Confetti from "@/components/Confetti";
import EmptyState from "@/components/EmptyState";
import TicketQr from "@/components/TicketQr";
import TicketTabs from "@/components/TicketTabs";
import { DownloadIcon, MapPinIcon, PartyIcon, TicketIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  "payment-failed": "Payment didn't go through. You haven't been charged for any tickets.",
  "sold-out": "Tickets sold out while you were paying. Contact support for a refund.",
  "verify-failed": "We couldn't confirm your payment yet. If you were charged, your ticket will appear here shortly.",
  "order-not-found": "We couldn't find that order.",
  "missing-reference": "Payment reference missing.",
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/tickets");
  const { ref, error } = await searchParams;
  const tickets = await getUserTickets(user.id);
  const now = Date.now();
  const upcoming = tickets.filter((t) => new Date(t.event.startsAt).getTime() > now - 12 * 3600e3);
  const past = tickets.filter((t) => !upcoming.includes(t));
  const success = Boolean(ref && !error);

  return (
    <div className="space-y-6">
      {success && <Confetti clearParam="ref" />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">My tickets</h1>
        <TicketTabs active="tickets" />
      </div>

      {success && (
        <div className="animate-pop flex items-center gap-4 rounded-3xl bg-linear-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-lg shadow-emerald-500/25">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
            <PartyIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-lg font-bold">You&apos;re in!</p>
            <p className="text-sm text-white/90">Your tickets are below. Show the QR code at the gate.</p>
          </div>
        </div>
      )}
      {error && (
        <div className="animate-pop rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERRORS[error] ?? "Something went wrong."}
        </div>
      )}

      {tickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="h-7 w-7" />}
          title="No tickets yet"
          text="When you get a ticket, its QR code shows up here."
        >
          <Link href="/" className="btn-primary">
            Find events
          </Link>
        </EmptyState>
      ) : (
        <>
          <TicketGrid tickets={upcoming} />
          {past.length > 0 && (
            <>
              <h2 className="pt-4 font-display text-xl font-bold text-zinc-400">Past events</h2>
              <div className="opacity-60 grayscale-[40%]">
                <TicketGrid tickets={past} offset={upcoming.length} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TicketGrid({
  tickets,
  offset = 0,
}: {
  tickets: Awaited<ReturnType<typeof getUserTickets>>;
  offset?: number;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tickets.map((t, i) => {
        const cat = categoryMeta(t.event.category);
        const d = dateParts(t.event.startsAt);
        return (
          <div
            key={t.id}
            className="ticket-shadow animate-fade-up"
            style={{ animationDelay: `${Math.min(i + offset, 8) * 80}ms`, "--glow": cat.glow } as React.CSSProperties}
          >
            <div className={`ticket-top relative overflow-hidden rounded-t-3xl bg-linear-to-br p-5 pb-6 text-white ${cat.gradient}`}>
              <div aria-hidden className="dot-pattern absolute inset-0 opacity-30" />
              <CategoryIcon
                category={t.event.category}
                strokeWidth={1.5}
                className="absolute -right-3 -top-3 h-24 w-24 rotate-12 text-white/25"
              />
              <p className="relative text-xs font-semibold uppercase tracking-wider text-white/85">
                {d.weekday} · {d.day} {d.month} · {d.time}
              </p>
              <Link
                href={`/events/${t.event.slug}`}
                className="relative mt-0.5 block py-1 font-display text-xl font-bold leading-snug hover:underline"
              >
                {t.event.title}
              </Link>
              <p className="relative mt-1.5 flex items-center gap-1.5 text-sm text-white/90">
                <MapPinIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.event.venue}</span>
              </p>
            </div>

            <div className="ticket-bottom relative rounded-b-3xl bg-white p-5 pt-6 text-center">
              <div aria-hidden className="absolute inset-x-5 top-0 border-t-2 border-dashed border-zinc-200" />
              <TicketQr
                src={t.qr}
                code={t.code}
                title={t.event.title}
                usedLabel={t.checkedInAt ? eventDate(t.checkedInAt) : undefined}
              />
              <p className="mt-4 font-mono text-sm font-bold tracking-[0.18em]">{t.code}</p>
              <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {t.ticketType.name}
              </span>
              {!t.checkedInAt && (
                <a
                  href={`/api/tickets/${t.code}/image`}
                  download={`EasyGate-${t.code}.png`}
                  className="btn-ghost mt-4 w-full py-3"
                >
                  <DownloadIcon className="h-4 w-4" /> Save ticket to phone
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
