import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOwnEvent } from "@/lib/organizer";
import { eventDate, hasEnded, naira } from "@/lib/format";
import EventCover from "@/components/EventCover";
import EventStatusChip from "@/components/EventStatusChip";
import StatTile from "@/components/StatTile";
import { BanknoteIcon, CheckIcon, ChevronLeftIcon, ScanIcon, TicketIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event } = await requireOwnEvent(id);
  const [tickets, revenue] = await Promise.all([
    prisma.ticket.findMany({
      where: { eventId: id },
      include: { user: { select: { name: true, email: true } }, ticketType: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.aggregate({ where: { eventId: id, status: "PAID" }, _sum: { amountKobo: true } }),
  ]);
  const checkedIn = tickets.filter((t) => t.checkedInAt).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/organizer" className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-muted transition-colors hover:text-brand-600">
          <ChevronLeftIcon className="h-4 w-4" strokeWidth={2.4} /> Dashboard
        </Link>
        <section className="card flex flex-wrap items-center gap-4 p-3 sm:p-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
            <EventCover title={event.title} category={event.category} imageUrl={event.imageUrl} size="sm" showTitle={false} />
          </div>
          <div className="min-w-0 flex-1">
            <EventStatusChip status={event.status} ended={hasEnded(event)} />
            <h1 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">{event.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {eventDate(event.startsAt)} · {event.venue}, {event.campus}
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Link href={`/events/${event.slug}`} className="btn-ghost flex-1 sm:flex-none">View page</Link>
            <Link href={`/organizer/events/${id}/scan`} className="btn-primary flex-1 sm:flex-none">
              <ScanIcon className="h-4 w-4" /> Scan tickets
            </Link>
          </div>
        </section>
        {event.status === "PENDING" && (
          <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <span className="font-bold">Waiting for review. </span>
            An EasyGate admin checks every new event before students can see it. You&apos;ll get a notification when it&apos;s live.
          </p>
        )}
        {event.status === "REJECTED" && (
          <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
            <span className="font-bold">Not approved. </span>
            {event.reviewNote ?? "Contact the EasyGate team for details."}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Tickets sold" value={tickets.length.toLocaleString()} icon={<TicketIcon className="h-5 w-5" />} />
        <StatTile
          label="Checked in"
          value={checkedIn.toLocaleString()}
          hint={`of ${tickets.length.toLocaleString()} tickets`}
          icon={<CheckIcon className="h-5 w-5" />}
          delay={70}
        />
        <StatTile
          label="Revenue"
          value={naira(revenue._sum.amountKobo ?? 0).replace("Free", "₦0")}
          icon={<BanknoteIcon className="h-5 w-5" />}
          delay={140}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="card overflow-hidden">
        <h2 className="border-b border-zinc-100 p-4 font-bold">Ticket types</h2>
        <table className="w-full text-sm">
          <tbody>
            {event.ticketTypes.map((t) => (
              <tr key={t.id} className="border-b border-zinc-50 last:border-0">
                <td className="p-4 font-medium">{t.name}</td>
                <td className="p-4">{naira(t.priceKobo)}</td>
                <td className="p-4 text-right">{t.sold} / {t.quantity} sold</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="border-b border-zinc-100 p-4 font-bold">Attendees</h2>
        {tickets.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">No tickets sold yet. Share your event link to get going.</p>
        ) : (
          <>
          <ul className="divide-y divide-zinc-100 sm:hidden">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.user.name}</p>
                  <p className="truncate text-xs text-zinc-500">{t.user.email}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t.ticketType.name} · <span className="font-mono">{t.code}</span>
                  </p>
                </div>
                {t.checkedInAt ? (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Checked in</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">Not yet</span>
                )}
              </li>
            ))}
          </ul>
          <table className="hidden w-full min-w-[560px] text-sm sm:table">
            <thead className="text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Ticket</th>
                <th className="p-4">Code</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-zinc-50">
                  <td className="p-4">
                    <p className="font-medium">{t.user.name}</p>
                    <p className="text-xs text-zinc-500">{t.user.email}</p>
                  </td>
                  <td className="p-4">{t.ticketType.name}</td>
                  <td className="p-4 font-mono text-xs">{t.code}</td>
                  <td className="p-4">
                    {t.checkedInAt ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Checked in</span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">Not yet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </div>
    </div>
  );
}
