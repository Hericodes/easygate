import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOrganizer } from "@/lib/organizer";
import { categoryMeta, eventDate, naira } from "@/lib/format";
import StatTile from "@/components/StatTile";
import CategoryIcon from "@/components/CategoryIcon";
import EmptyState from "@/components/EmptyState";
import { ArrowRightIcon, BanknoteIcon, CalendarIcon, PlusIcon, TicketIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const money = (kobo: number) => naira(kobo).replace("Free", "₦0");

export default async function OrganizerDashboard() {
  const user = await requireOrganizer();
  const events = await prisma.event.findMany({
    where: { organizerId: user.id },
    orderBy: { startsAt: "desc" },
    include: {
      ticketTypes: true,
      _count: { select: { tickets: { where: { checkedInAt: { not: null } } } } },
    },
  });
  const revenue = await prisma.order.groupBy({
    by: ["eventId"],
    where: { status: "PAID", event: { organizerId: user.id } },
    _sum: { amountKobo: true },
  });
  const revenueBy = new Map(revenue.map((r) => [r.eventId, r._sum.amountKobo ?? 0]));
  const totalRevenue = revenue.reduce((n, r) => n + (r._sum.amountKobo ?? 0), 0);
  const totalSold = events.reduce((n, e) => n + e.ticketTypes.reduce((m, t) => m + t.sold, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Organizer dashboard</h1>
          <p className="text-sm text-zinc-500">Hi {user.name}, here&apos;s how your events are doing.</p>
        </div>
        <Link href="/organizer/events/new" className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Create event
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Events" value={events.length.toLocaleString()} icon={<CalendarIcon className="h-5 w-5" />} />
        <StatTile label="Tickets sold" value={totalSold.toLocaleString()} icon={<TicketIcon className="h-5 w-5" />} delay={70} />
        <StatTile label="Revenue" value={money(totalRevenue)} icon={<BanknoteIcon className="h-5 w-5" />} delay={140} className="col-span-2 sm:col-span-1" />
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-7 w-7" />}
          title="No events yet"
          text="Create your first event and start selling tickets."
        >
          <Link href="/organizer/events/new" className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Create event
          </Link>
        </EmptyState>
      ) : (
        <div className="card animate-fade-up divide-y divide-zinc-100 overflow-hidden" style={{ animationDelay: "200ms" }}>
          {events.map((e) => {
            const cat = categoryMeta(e.category);
            const sold = e.ticketTypes.reduce((n, t) => n + t.sold, 0);
            const cap = e.ticketTypes.reduce((n, t) => n + t.quantity, 0);
            const pct = cap ? Math.round((sold / cap) * 100) : 0;
            return (
              <Link
                key={e.id}
                href={`/organizer/events/${e.id}`}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 p-4 transition-colors hover:bg-brand-50/50 sm:grid-cols-[auto_1fr_11rem_7rem_auto]"
              >
                <span
                  aria-hidden
                  className={`row-span-2 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br text-white shadow-sm sm:row-span-1 ${cat.gradient}`}
                >
                  <CategoryIcon category={e.category} className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-semibold transition-colors group-hover:text-brand-700">{e.title}</p>
                  <p className="text-sm text-zinc-500">
                    {eventDate(e.startsAt)} · {e.venue}
                  </p>
                </div>
                <p className="text-right font-semibold tabular-nums sm:col-start-4 sm:row-start-1">
                  {money(revenueBy.get(e.id) ?? 0)}
                </p>
                <div className="col-span-2 col-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>
                      {sold.toLocaleString()} / {cap.toLocaleString()} sold
                    </span>
                    <span>{e._count.tickets.toLocaleString()} in</span>
                  </div>
                  <div
                    role="meter"
                    aria-label={`${e.title}: ${pct}% sold`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-100"
                  >
                    <div
                      className="animate-grow-x h-full origin-left rounded-full bg-brand-500"
                      style={{ width: `${pct}%`, animationDelay: "300ms" }}
                    />
                  </div>
                </div>
                <ArrowRightIcon className="hidden h-4 w-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 sm:col-start-5 sm:row-start-1 sm:block" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
