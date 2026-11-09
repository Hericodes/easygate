import Link from "next/link";
import EventCover from "./EventCover";
import { ArrowRightIcon, CalendarIcon, MapPinIcon } from "./icons";
import { dateParts, hasEnded } from "@/lib/format";

export type TicketCardData = {
  code: string;
  checkedInAt: Date | null;
  ticketType: { name: string };
  event: {
    title: string;
    venue: string;
    startsAt: Date;
    endsAt: Date | null;
    category: string;
    imageUrl: string | null;
  };
};

/** One of your tickets in a list, with its status and a View ticket action. */
export default function TicketCard({ ticket, index = 0 }: { ticket: TicketCardData; index?: number }) {
  const d = dateParts(ticket.event.startsAt);
  const status = ticket.checkedInAt ? "used" : hasEnded(ticket.event) ? "ended" : "valid";

  return (
    <Link
      href={`/tickets/${ticket.code}`}
      className="card group animate-fade-up flex gap-3.5 p-2.5 transition duration-300 [@media(hover:hover)]:hover:-translate-y-0.5"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative min-h-[112px] w-[96px] shrink-0 self-stretch overflow-hidden rounded-[18px] sm:w-[120px]">
        <EventCover title={ticket.event.title} category={ticket.event.category} imageUrl={ticket.event.imageUrl} size="sm" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={status} />
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            {ticket.ticketType.name}
          </span>
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-ink transition-colors group-hover:text-brand-700">
          {ticket.event.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" /> {d.weekday}, {d.day} {d.month} • {d.time}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{ticket.event.venue}</span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="truncate font-mono text-[11px] tracking-wider text-muted">{ticket.code}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-brand-600">
            View ticket <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function StatusBadge({ status }: { status: "valid" | "used" | "ended" }) {
  const styles = {
    valid: ["bg-emerald-50 text-emerald-700", "Valid"],
    used: ["bg-zinc-100 text-zinc-600", "Used"],
    ended: ["bg-zinc-100 text-zinc-600", "Event ended"],
  } as const;
  const [cls, label] = styles[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {status === "valid" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {label}
    </span>
  );
}
