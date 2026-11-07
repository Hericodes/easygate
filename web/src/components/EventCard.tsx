import Link from "next/link";
import CategoryIcon from "./CategoryIcon";
import { ArrowRightIcon, ClockIcon, FlameIcon, MapPinIcon, ZapIcon } from "./icons";
import { categoryMeta, dateParts, naira, soonLabel } from "@/lib/format";

type Props = {
  event: {
    slug: string;
    title: string;
    category: string;
    venue: string;
    startsAt: Date;
    imageUrl: string | null;
    ticketTypes: { priceKobo: number; quantity: number; sold: number }[];
  };
  /** Position in the grid, used to stagger the entrance animation. */
  index?: number;
};

/** An event shaped like a ticket: artwork on top, a punched tear line, details below. */
export default function EventCard({ event, index = 0 }: Props) {
  const cat = categoryMeta(event.category);
  const d = dateParts(event.startsAt);
  const prices = event.ticketTypes.map((t) => t.priceKobo);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const capacity = event.ticketTypes.reduce((n, t) => n + t.quantity, 0);
  const left = event.ticketTypes.reduce((n, t) => n + Math.max(0, t.quantity - t.sold), 0);
  const soldOut = left <= 0;
  const sellingFast = !soldOut && (left <= 20 || left / capacity <= 0.2);
  const soon = soonLabel(event.startsAt);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="ticket-shadow group animate-fade-up flex flex-col"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms`, "--glow": cat.glow } as React.CSSProperties}
    >
      {/* Artwork */}
      <div className={`ticket-top relative h-44 overflow-hidden rounded-t-3xl bg-linear-to-br ${cat.gradient}`}>
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            <div aria-hidden className="dot-pattern absolute inset-0 opacity-50" />
            <div aria-hidden className="absolute -right-12 -top-12 h-44 w-44 rounded-full border-[20px] border-white/15" />
            <div aria-hidden className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
            <CategoryIcon
              category={event.category}
              strokeWidth={1.5}
              className="absolute -bottom-3 right-4 h-28 w-28 -rotate-12 text-white/45 transition duration-500 group-hover:rotate-0 group-hover:scale-110 group-hover:text-white/70"
            />
          </>
        )}

        {/* Calendar badge */}
        <div className="absolute left-3 top-3 w-14 overflow-hidden rounded-2xl bg-white text-center shadow-lg">
          <p className="bg-ink py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">{d.month}</p>
          <p className="py-1 font-display text-2xl font-bold leading-none text-ink">{d.day}</p>
        </div>

        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <CategoryIcon category={event.category} className="h-3.5 w-3.5" />
            {cat.label}
          </span>
          {soon && !soldOut && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink shadow">
              <ZapIcon className="h-3.5 w-3.5" />
              {soon}
            </span>
          )}
        </div>

        {sellingFast && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-orange-600 shadow">
            <FlameIcon className="h-3.5 w-3.5" />
            Selling fast
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-ink/55 backdrop-blur-[2px]">
            <span className="-rotate-6 rounded-xl border-2 border-white px-4 py-1.5 font-display text-xl font-bold uppercase tracking-wider text-white">
              Sold out
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="ticket-bottom relative flex flex-1 flex-col rounded-b-3xl bg-white p-5 pt-4">
        <div aria-hidden className="absolute inset-x-5 top-0 border-t-2 border-dashed border-zinc-200" />
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug transition-colors group-hover:text-brand-700">
          {event.title}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
          <ClockIcon className="h-4 w-4 shrink-0" />
          {d.weekday}, {d.time}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
          <MapPinIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{event.venue}</span>
        </p>
        <div className="mt-auto flex items-center justify-between pt-4">
          {minPrice === 0 ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">Free</span>
          ) : (
            <span className="text-sm text-zinc-500">
              From <span className="font-display text-lg font-bold text-ink">{naira(minPrice)}</span>
            </span>
          )}
          <span className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-ink transition duration-300 group-hover:brand-gradient group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand-500/30">
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
