import Link from "next/link";
import CategoryIcon from "./CategoryIcon";
import EventCover from "./EventCover";
import { ArrowRightIcon, CalendarIcon, FlameIcon, MapPinIcon, ZapIcon } from "./icons";
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

/** An event in a list: cover, type, title, date, venue, price, availability and a Get Ticket button. */
export default function EventCard({ event, index = 0 }: { event: EventCardData; index?: number }) {
  const cat = categoryMeta(event.category);
  const d = dateParts(event.startsAt);
  const { left, soldOut, sellingFast } = availability(event.ticketTypes);
  const price = lowestPrice(event.ticketTypes);
  const soon = soonLabel(event.startsAt);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="card group animate-fade-up flex gap-3.5 p-2.5 transition duration-300 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-[0_22px_40px_-20px_rgb(59_7_100/0.35)]"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative min-h-[118px] w-[108px] shrink-0 self-stretch overflow-hidden rounded-[18px] sm:w-[136px]">
        <EventCover title={event.title} category={event.category} imageUrl={event.imageUrl} size="sm" />
        {soldOut && (
          <span className="absolute inset-0 grid place-items-center bg-[#0b0420]/60 text-[11px] font-extrabold uppercase tracking-wider text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cat.tile}`}>
            <CategoryIcon category={event.category} className="h-3.5 w-3.5" />
            {cat.label}
          </span>
          {!soldOut && sellingFast ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
              <FlameIcon className="h-3 w-3" />
              {left <= 20 ? `${left} left` : "Selling fast"}
            </span>
          ) : (
            !soldOut &&
            soon && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                <ZapIcon className="h-3 w-3" />
                {soon}
              </span>
            )
          )}
        </div>

        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-ink transition-colors group-hover:text-brand-700 sm:text-base">
          {event.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
          {d.weekday}, {d.day} {d.month} • {d.time}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.venue}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <p className="text-[13px] font-bold text-ink">
            {price === 0 ? (
              <span className="text-emerald-600">Free</span>
            ) : (
              <>
                <span className="font-medium text-muted">From </span>
                {naira(price)}
              </>
            )}
          </p>
          {soldOut ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-muted">Sold out</span>
          ) : (
            <span className="btn-primary h-8 gap-1 px-3.5 text-xs">
              Get Ticket <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
