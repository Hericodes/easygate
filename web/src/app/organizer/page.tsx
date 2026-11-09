import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOrganizer } from "@/lib/organizer";
import { categoryMeta, eventDate, hasEnded, money } from "@/lib/format";
import { CrowdSilhouette } from "@/components/Art";
import EmptyState from "@/components/EmptyState";
import EventCover from "@/components/EventCover";
import StatTile from "@/components/StatTile";
import {
  BanknoteIcon,
  CalendarIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  PlusIcon,
  ScanQrIcon,
  TicketIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

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
  const totalIn = events.reduce((n, e) => n + e._count.tickets, 0);
  const upcoming = events.filter((e) => !hasEnded(e)).length;

  return (
    <div className="space-y-6">
      <section className="hero-surface relative isolate overflow-hidden rounded-[28px] p-6 text-white sm:p-8">
        <CrowdSilhouette repeat={2} className="absolute inset-x-0 bottom-0 -z-10 h-20 w-full text-[#12042a]/70" />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-200">Organizer dashboard</p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Welcome back, {user.name}</h1>
        <p className="mt-1 text-sm text-white/75">
          {upcoming === 1 ? "1 upcoming event" : `${upcoming} upcoming events`}. Here&apos;s how your sales are going.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link href="/organizer/events/new" className="btn-white">
            <PlusIcon className="h-4 w-4" strokeWidth={2.4} /> Create event
          </Link>
          <Link href="/organizer/scan" className="btn bg-white/15 text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/25">
            <ScanQrIcon className="h-4 w-4" /> Scan tickets
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Events" value={events.length.toLocaleString()} icon={<CalendarIcon className="h-5 w-5" />} />
        <StatTile label="Tickets sold" value={totalSold.toLocaleString()} icon={<TicketIcon className="h-5 w-5" />} delay={60} />
        <StatTile label="Revenue" value={money(totalRevenue)} icon={<BanknoteIcon className="h-5 w-5" />} delay={120} />
        <StatTile label="Checked in" value={totalIn.toLocaleString()} icon={<CircleCheckIcon className="h-5 w-5" />} delay={180} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Your events</h2>
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
          <div className="card animate-fade-up divide-y divide-line overflow-hidden">
            {events.map((e) => {
              const cat = categoryMeta(e.category);
              const sold = e.ticketTypes.reduce((n, t) => n + t.sold, 0);
              const cap = e.ticketTypes.reduce((n, t) => n + t.quantity, 0);
              const pct = cap ? Math.round((sold / cap) * 100) : 0;
              const ended = hasEnded(e);
              return (
                <Link
                  key={e.id}
                  href={`/organizer/events/${e.id}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 p-4 transition-colors hover:bg-brand-50/50 sm:grid-cols-[auto_1fr_11rem_7rem_auto]"
                >
                  <div className="relative row-span-2 h-14 w-14 overflow-hidden rounded-2xl sm:row-span-1">
                    <EventCover title={e.title} category={e.category} imageUrl={e.imageUrl} size="sm" showTitle={false} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cat.tile}`}>{cat.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          ended ? "bg-zinc-100 text-zinc-600" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {ended ? "Ended" : "Upcoming"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 font-bold text-ink transition-colors group-hover:text-brand-700">{e.title}</p>
                    <p className="text-sm text-muted">
                      {eventDate(e.startsAt)} · {e.venue}
                    </p>
                  </div>
                  <p className="text-right font-bold tabular-nums text-ink sm:col-start-4 sm:row-start-1">
                    {money(revenueBy.get(e.id) ?? 0)}
                  </p>
                  <div className="col-span-2 col-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
                    <div className="flex justify-between text-xs text-muted">
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
                      <div className="animate-grow-x h-full origin-left rounded-full bg-brand-600" style={{ width: `${pct}%`, animationDelay: "300ms" }} />
                    </div>
                  </div>
                  <ChevronRightIcon className="hidden h-5 w-5 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 sm:col-start-5 sm:row-start-1 sm:block" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
