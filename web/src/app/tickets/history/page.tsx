import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrderHistory } from "@/lib/order-history";
import { eventDate, naira } from "@/lib/format";
import TicketTabs from "@/components/TicketTabs";
import StatTile from "@/components/StatTile";
import EmptyState from "@/components/EmptyState";
import { BanknoteIcon, PartyIcon, ReceiptIcon, TicketIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Paid", cls: "bg-emerald-50 text-emerald-700" },
  PENDING: { label: "Not completed", cls: "bg-zinc-100 text-zinc-600" },
  FAILED: { label: "Failed", cls: "bg-red-50 text-red-700" },
};

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/tickets/history");
  const { orders, summary } = await getOrderHistory(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">Ticket history</h1>
        <TicketTabs active="history" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Total spent" value={naira(summary.totalSpentKobo).replace("Free", "₦0")} icon={<BanknoteIcon className="h-5 w-5" />} />
        <StatTile label="Tickets bought" value={summary.ticketsBought.toLocaleString()} icon={<TicketIcon className="h-5 w-5" />} delay={70} />
        <StatTile label="Events attended" value={summary.eventsAttended.toLocaleString()} icon={<PartyIcon className="h-5 w-5" />} delay={140} className="col-span-2 sm:col-span-1" />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon className="h-7 w-7" />}
          title="No purchases yet"
          text="Your orders and receipts will show up here."
        >
          <Link href="/" className="btn-primary">Find events</Link>
        </EmptyState>
      ) : (
        <div className="card animate-fade-up divide-y divide-zinc-100 overflow-hidden" style={{ animationDelay: "200ms" }}>
          {orders.map((o) => {
            const s = STATUS[o.status] ?? STATUS.PENDING;
            const used = o.tickets.filter((t) => t.checkedInAt).length;
            return (
              <div key={o.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 transition-colors hover:bg-brand-50/40">
                <div className="min-w-0 flex-1">
                  <Link href={`/events/${o.event.slug}`} className="inline-block py-1.5 font-semibold hover:text-brand-700">
                    {o.event.title}
                  </Link>
                  <p className="text-sm text-zinc-500">
                    {o.quantity} × {o.ticketType.name} · Event {eventDate(o.event.startsAt)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Ordered {eventDate(o.createdAt)} · Ref <span className="font-mono">{o.reference}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{naira(o.amountKobo)}</p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
                    {s.label}
                  </span>
                  {o.status === "PAID" && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {used > 0 ? `${used}/${o.tickets.length} used` : "Not used yet"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-sm text-zinc-500">
        Charged but don&apos;t see your ticket? Keep your payment reference and contact the event organizer.
      </p>
    </div>
  );
}
