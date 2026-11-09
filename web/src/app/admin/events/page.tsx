import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { categoryMeta, eventDate, hasEnded, naira, timeAgo } from "@/lib/format";
import EmptyState from "@/components/EmptyState";
import EventCover from "@/components/EventCover";
import EventReviewActions from "@/components/EventReviewActions";
import EventStatusChip from "@/components/EventStatusChip";
import SearchBox from "@/components/AdminSearch";
import { CalendarIcon, MapPinIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const TABS = [
  ["PENDING", "Waiting"],
  ["APPROVED", "Live"],
  ["REJECTED", "Not approved"],
  ["ALL", "All"],
] as const;

export default async function AdminEvents({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin("/admin/events");
  const sp = await searchParams;
  const status = TABS.some(([v]) => v === sp.status) ? sp.status! : "PENDING";
  const q = sp.q?.trim() || undefined;

  const [counts, events] = await Promise.all([
    prisma.event.groupBy({ by: ["status"], _count: true }),
    prisma.event.findMany({
      where: {
        ...(status === "ALL" ? {} : { status }),
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      },
      orderBy: status === "PENDING" ? { createdAt: "asc" } : { createdAt: "desc" },
      take: 50,
      include: {
        organizer: { select: { name: true, email: true } },
        ticketTypes: { orderBy: { priceKobo: "asc" } },
      },
    }),
  ]);
  const countFor = (s: string) =>
    s === "ALL" ? counts.reduce((n, c) => n + c._count, 0) : (counts.find((c) => c.status === s)?._count ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {TABS.map(([value, label]) => (
            <Link
              key={value}
              href={`/admin/events?status=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                status === value ? "bg-ink text-white ring-ink" : "bg-white text-muted ring-line hover:text-ink"
              }`}
            >
              {label} <span className="opacity-70">({countFor(value)})</span>
            </Link>
          ))}
        </div>
        <SearchBox action="/admin/events" q={q} placeholder="Search events" hidden={{ status }} />
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-7 w-7" />}
          title={status === "PENDING" ? "No events waiting" : "No events here"}
          text={status === "PENDING" ? "When organizers submit new events, they'll appear here for review." : "Try another tab or search."}
        />
      ) : (
        <ul className="space-y-4">
          {events.map((e) => {
            const cat = categoryMeta(e.category);
            const sold = e.ticketTypes.reduce((n, t) => n + t.sold, 0);
            return (
              <li key={e.id} id={`event-${e.id}`} className="card animate-fade-up scroll-mt-24 p-4 sm:p-5">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
                    <EventCover title={e.title} category={e.category} imageUrl={e.imageUrl} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <EventStatusChip status={e.status} ended={hasEnded(e)} />
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cat.tile}`}>{cat.label}</span>
                      <span className="text-[11px] text-muted">submitted {timeAgo(e.createdAt)}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-extrabold leading-snug text-ink">{e.title}</h3>
                    <p className="text-sm text-muted">
                      by <span className="font-semibold text-ink">{e.organizer.name}</span> · {e.organizer.email}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <CalendarIcon className="h-4 w-4 shrink-0" /> {eventDate(e.startsAt)}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <MapPinIcon className="h-4 w-4 shrink-0" /> <span className="truncate">{e.venue}</span>
                    </p>
                  </div>
                </div>

                <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-ink/80">{e.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {e.ticketTypes.map((t) => (
                    <span key={t.id} className="rounded-full bg-page px-3 py-1 text-xs font-semibold text-ink ring-1 ring-line">
                      {t.name} · {naira(t.priceKobo)} · {t.sold}/{t.quantity}
                    </span>
                  ))}
                </div>
                {e.reviewNote && (
                  <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">Reason given: {e.reviewNote}</p>
                )}

                <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-line pt-4">
                  <Link href={`/events/${e.slug}`} className="btn-soft">
                    Preview page
                  </Link>
                  <EventReviewActions id={e.id} status={e.status} sold={sold} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
