import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { eventDate, money, timeAgo } from "@/lib/format";
import EmptyState from "@/components/EmptyState";
import EventCover from "@/components/EventCover";
import StatTile from "@/components/StatTile";
import {
  BanknoteIcon,
  CalendarIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  SparklesIcon,
  TicketIcon,
  UsersIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  await requireAdmin();
  const weekAgo = new Date(Date.now() - 7 * 864e5);

  const [users, newUsers, organizers, liveEvents, tickets, checkedIn, revenue, pendingEvents, pendingApps, recentOrders] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { role: "ORGANIZER" } }),
      prisma.event.count({ where: { status: "APPROVED", startsAt: { gte: new Date() } } }),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { checkedInAt: { not: null } } }),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amountKobo: true } }),
      prisma.event.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 5,
        select: { id: true, title: true, category: true, imageUrl: true, startsAt: true, createdAt: true, organizer: { select: { name: true } } },
      }),
      prisma.organizerApplication.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 5,
        select: { id: true, orgName: true, createdAt: true, user: { select: { name: true } } },
      }),
      prisma.order.findMany({
        where: { status: "PAID" },
        orderBy: { paidAt: "desc" },
        take: 5,
        select: {
          id: true,
          amountKobo: true,
          quantity: true,
          paidAt: true,
          user: { select: { name: true } },
          event: { select: { title: true } },
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Users" value={users.toLocaleString()} hint={`${newUsers} new this week`} icon={<UsersIcon className="h-5 w-5" />} />
        <StatTile label="Organizers" value={organizers.toLocaleString()} icon={<SparklesIcon className="h-5 w-5" />} delay={40} />
        <StatTile label="Live events" value={liveEvents.toLocaleString()} icon={<CalendarIcon className="h-5 w-5" />} delay={80} />
        <StatTile label="Tickets issued" value={tickets.toLocaleString()} icon={<TicketIcon className="h-5 w-5" />} delay={120} />
        <StatTile label="Revenue" value={money(revenue._sum.amountKobo ?? 0)} hint="Paid orders" icon={<BanknoteIcon className="h-5 w-5" />} delay={160} />
        <StatTile label="Checked in" value={checkedIn.toLocaleString()} icon={<CircleCheckIcon className="h-5 w-5" />} delay={200} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card animate-fade-up overflow-hidden">
          <Header title="Events waiting for review" href="/admin/events" count={pendingEvents.length} />
          {pendingEvents.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted">Nothing to review. New events will appear here before they go live.</p>
          ) : (
            <ul className="divide-y divide-line">
              {pendingEvents.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/events?status=PENDING#event-${e.id}`} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-brand-50/50">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                      <EventCover title={e.title} category={e.category} imageUrl={e.imageUrl} size="sm" showTitle={false} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink">{e.title}</p>
                      <p className="truncate text-xs text-muted">
                        {e.organizer.name} · {eventDate(e.startsAt)} · submitted {timeAgo(e.createdAt)}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-zinc-300 group-hover:text-brand-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card animate-fade-up overflow-hidden" style={{ animationDelay: "60ms" }}>
          <Header title="Organizer applications" href="/admin/applications" count={pendingApps.length} />
          {pendingApps.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted">No applications waiting.</p>
          ) : (
            <ul className="divide-y divide-line">
              {pendingApps.map((a) => (
                <li key={a.id}>
                  <Link href="/admin/applications" className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-brand-50/50">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600">
                      <SparklesIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink">{a.orgName}</p>
                      <p className="truncate text-xs text-muted">
                        {a.user.name} · applied {timeAgo(a.createdAt)}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-zinc-300 group-hover:text-brand-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card animate-fade-up overflow-hidden" style={{ animationDelay: "120ms" }}>
        <Header title="Recent payments" href="/admin/orders" />
        {recentOrders.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState icon={<BanknoteIcon className="h-7 w-7" />} title="No payments yet" text="Paid orders will show up here." />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <BanknoteIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">
                    {o.user.name} · {o.quantity} × {o.event.title}
                  </p>
                  <p className="text-xs text-muted">{o.paidAt ? timeAgo(o.paidAt) : ""}</p>
                </div>
                <p className="font-bold tabular-nums text-ink">{money(o.amountKobo)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Header({ title, href, count }: { title: string; href: string; count?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        {title}
        {count ? <span className="grid h-6 min-w-6 place-items-center rounded-full bg-pink-500 px-1.5 text-xs font-bold text-white">{count}</span> : null}
      </h2>
      <Link href={href} className="inline-flex items-center gap-0.5 text-sm font-bold text-brand-600 hover:text-brand-800">
        View all <ChevronRightIcon className="h-4 w-4" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
