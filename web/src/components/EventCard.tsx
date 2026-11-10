import Link from "next/link";
import CategoryIcon from "./CategoryIcon";
import EventCover from "./EventCover";
import { ArrowRightIcon, FlameIcon, MapPinIcon, ZapIcon } from "./icons";
import { availability, categoryMeta, dateParts, lowestPrice, naira, soonLabel } from "@/lib/format";

export type EventCardData = {
  slug: string;
  title: string;
  category: string;
  venue: string;
  startsAt: Date;
  imageUrl: string | null;
  ticketTypes: { priceKobo: number; quantity: number; sold: number }[];
};

/**
 * An event as a poster: the flyer (shown whole, never cropped) with the date and status on it,
 * then the type, name, time, venue and price. Events without a flyer get a generated cover.
 */
export default function EventCard({ event, index = 0 }: { event: EventCardData; index?: number }) {
  const cat = categoryMeta(event.category);
  const d = dateParts(event.startsAt);
  const { left, soldOut, sellingFast } = availability(event.ticketTypes);
  const price = lowestPrice(event.ticketTypes);
  const soon = soonLabel(event.startsAt);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="card group animate-fade-up flex flex-col overflow-hidden transition duration-300 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[0_26px_50px_-24px_rgb(59_7_100/0.45)]"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#150833]">
        <div className="h-full w-full transition duration-500 ease-out [@media(hover:hover)]:group-hover:scale-[1.04]">
          <EventCover title={event.title} category={event.category} imageUrl={event.imageUrl} size="md" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/25 to-transparent" />

        {/* Date */}
        <div className="absolute left-2 top-2 min-w-11 rounded-[14px] bg-white/95 px-2 py-1.5 text-center shadow-lg shadow-black/20 sm:left-3 sm:top-3 sm:min-w-12">
          <p className="text-[10px] font-extrabold uppercase leading-none tracking-wider text-brand-600">{d.month}</p>
          <p className="mt-0.5 text-lg font-extrabold leading-none text-ink sm:text-xl">{d.day}</p>
        </div>

        {/* Status */}
        {soldOut ? (
          <Chip className="bg-zinc-900/80 text-white">Sold out</Chip>
        ) : sellingFast ? (
          <Chip className="bg-orange-500 text-white">
            <FlameIcon className="h-3 w-3" />
            {left <= 20 ? `${left} left` : "Hot"}
          </Chip>
        ) : soon ? (
          <Chip className="bg-white/95 text-brand-700">
            <ZapIcon className="h-3 w-3" />
            {soon}
          </Chip>
        ) : null}

        {soldOut && <div aria-hidden className="absolute inset-0 bg-[#0b0420]/35" />}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className={`mb-1.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cat.tile}`}>
          <CategoryIcon category={event.category} className="h-3.5 w-3.5 shrink-0" />
          {cat.label}
        </span>
        <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-ink transition-colors group-hover:text-brand-700 sm:text-base">
          {event.title}
        </h3>
        <p className="mt-1 text-[12px] font-semibold text-brand-600 sm:text-[13px]">
          {d.weekday} • {d.time}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted sm:text-[13px]">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.venue}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="min-w-0 truncate text-[13px] font-extrabold text-ink sm:text-sm">
            {soldOut ? (
              <span className="font-semibold text-muted">Sold out</span>
            ) : price === 0 ? (
              <span className="text-emerald-600">Free</span>
            ) : (
              <>
                <span className="text-[11px] font-medium text-muted sm:text-xs">From </span>
                {naira(price)}
              </>
            )}
          </p>
          {!soldOut && (
            <span className="primary-gradient inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-white shadow-md shadow-brand-600/30 transition [@media(hover:hover)]:group-hover:gap-1.5 sm:px-3.5">
              <span className="hidden sm:inline">Get Ticket</span>
              <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold shadow-md shadow-black/20 sm:right-3 sm:top-3 ${className}`}
    >
      {children}
    </span>
  );
}
