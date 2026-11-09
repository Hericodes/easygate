import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasEnded } from "@/lib/format";
import Confetti from "@/components/Confetti";
import EmptyState from "@/components/EmptyState";
import TicketCard from "@/components/TicketCard";
import TicketTabs from "@/components/TicketTabs";
import { PartyIcon, TicketIcon } from "@/components/icons";

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
  searchParams: Promise<{ ref?: string; error?: string; view?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/tickets");
  const { ref, error, view } = await searchParams;

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      code: true,
      checkedInAt: true,
      ticketType: { select: { name: true } },
      event: { select: { title: true, venue: true, startsAt: true, endsAt: true, category: true, imageUrl: true } },
    },
    orderBy: { event: { startsAt: "asc" } },
  });
  const upcoming = tickets.filter((t) => !hasEnded(t.event));
  const past = tickets.filter((t) => hasEnded(t.event)).reverse();
  const showPast = view === "past";
  const list = showPast ? past : upcoming;
  const success = Boolean(ref && !error);

  return (
    <div className="space-y-5">
      {success && <Confetti clearParam="ref" />}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">My Tickets</h1>
          <p className="mt-1 text-sm text-muted">Show the QR code at the gate. Each ticket can be scanned once.</p>
        </div>
        <TicketTabs active={showPast ? "past" : "upcoming"} counts={{ upcoming: upcoming.length, past: past.length }} />
      </div>

      {success && (
        <div className="animate-pop flex items-center gap-4 rounded-3xl bg-linear-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-lg shadow-emerald-500/25">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
            <PartyIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-extrabold">You&apos;re in!</p>
            <p className="text-sm text-white/90">Your ticket is ready. Open it to see the QR code for the gate.</p>
          </div>
        </div>
      )}
      {error && (
        <div className="animate-pop rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERRORS[error] ?? "Something went wrong."}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="h-7 w-7" />}
          title={showPast ? "No past tickets" : "No upcoming tickets"}
          text={
            showPast
              ? "Tickets for events you've attended will show up here."
              : "When you get a ticket, it shows up here with its QR code."
          }
        >
          <Link href="/events" className="btn-primary">
            Find events
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((t, i) => (
            <TicketCard key={t.id} ticket={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
