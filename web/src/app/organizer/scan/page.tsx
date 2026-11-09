import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrganizer } from "@/lib/organizer";
import { dateParts, soonLabel } from "@/lib/format";
import EmptyState from "@/components/EmptyState";
import EventCover from "@/components/EventCover";
import { ChevronLeftIcon, PlusIcon, ScanQrIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/** Pick which event to check guests in for. Goes straight to the scanner when there's only one. */
export default async function ScanPicker() {
  const user = await requireOrganizer();
  const events = await prisma.event.findMany({
    where: { organizerId: user.id, status: "APPROVED", startsAt: { gte: new Date(Date.now() - 24 * 3600e3) } },
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { tickets: true } } },
  });
  if (events.length === 1) redirect(`/organizer/events/${events[0].id}/scan`);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/organizer" className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-muted transition-colors hover:text-brand-600">
          <ChevronLeftIcon className="h-4 w-4" strokeWidth={2.4} /> Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Scan tickets</h1>
        <p className="mt-1 text-sm text-muted">Choose the event you&apos;re checking guests in for.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<ScanQrIcon className="h-7 w-7" />}
          title="No upcoming events"
          text="Once you have an event coming up, you can scan its tickets here."
        >
          <Link href="/organizer/events/new" className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Create event
          </Link>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {events.map((e, i) => {
            const d = dateParts(e.startsAt);
            const soon = soonLabel(e.startsAt);
            return (
              <li key={e.id} className="card animate-fade-up flex items-center gap-3.5 p-3" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                  <EventCover title={e.title} category={e.category} imageUrl={e.imageUrl} size="sm" showTitle={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{e.title}</p>
                  <p className="text-sm text-muted">
                    {soon ?? `${d.weekday}, ${d.day} ${d.month}`} · {d.time} · {e._count.tickets.toLocaleString()} tickets
                  </p>
                </div>
                <Link href={`/organizer/events/${e.id}/scan`} className="btn-primary h-10 px-4">
                  <ScanQrIcon className="h-4 w-4" /> Scan
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
