// All events are at OOU, so dates and times always show in Nigerian time,
// whatever timezone the server runs in.
const TZ = "Africa/Lagos";

export const CATEGORIES = [
  {
    value: "PARTY",
    label: "Party",
    short: "Parties",
    gradient: "from-pink-500 to-purple-500",
    // Plain colours for generated covers and ticket images (stage lights).
    hex: ["#ec4899", "#a855f7"],
    tile: "bg-pink-50 text-pink-500",
  },
  {
    value: "CONCERT",
    label: "Concert",
    short: "Concerts",
    gradient: "from-brand-600 to-purple-500",
    hex: ["#a855f7", "#6415f5"],
    tile: "bg-purple-50 text-purple-600",
  },
  {
    value: "CONFERENCE",
    label: "Talk",
    short: "Talks",
    gradient: "from-indigo-500 to-sky-500",
    hex: ["#6366f1", "#0ea5e9"],
    tile: "bg-indigo-50 text-indigo-600",
  },
  {
    value: "SPORTS",
    label: "Sports",
    short: "Sports",
    gradient: "from-emerald-500 to-sky-500",
    hex: ["#10b981", "#0ea5e9"],
    tile: "bg-amber-50 text-amber-500",
  },
  {
    value: "RELIGIOUS",
    label: "Religious",
    short: "Religious",
    gradient: "from-amber-500 to-pink-500",
    hex: ["#f59e0b", "#ec4899"],
    tile: "bg-orange-50 text-orange-500",
  },
  {
    value: "OTHER",
    label: "Other",
    short: "Other",
    gradient: "from-brand-900 to-purple-500",
    hex: ["#8b5cf6", "#ec4899"],
    tile: "bg-fuchsia-50 text-fuchsia-600",
  },
] as const;

export function categoryMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function categoryLabel(value: string) {
  return categoryMeta(value).label;
}

export function naira(kobo: number) {
  if (kobo === 0) return "Free";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

/** Like naira(), but shows ₦0 instead of "Free" (for totals and revenue). */
export function money(kobo: number) {
  return naira(kobo).replace("Free", "₦0");
}

export function eventDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(d));
}

/** Pieces of a date: { day: "12", month: "Nov", weekday: "Wed", time: "8:00 pm", year: "2026" }. */
export function dateParts(d: Date | string) {
  const date = new Date(d);
  const f = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-NG", { timeZone: TZ, ...o }).format(date);
  return {
    day: f({ day: "numeric" }),
    month: f({ month: "short" }),
    weekday: f({ weekday: "short" }),
    time: f({ hour: "numeric", minute: "2-digit", hour12: true }),
    year: f({ year: "numeric" }),
  };
}

/** "Today", "Tomorrow" or "This week" (Nigerian time), otherwise null. */
export function soonLabel(d: Date | string) {
  const dayKey = (x: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(x);
  const target = new Date(d);
  const now = new Date();
  if (dayKey(target) === dayKey(now)) return "Today";
  if (dayKey(target) === dayKey(new Date(now.getTime() + 864e5))) return "Tomorrow";
  const diff = target.getTime() - now.getTime();
  if (diff > 0 && diff < 7 * 864e5) return "This week";
  return null;
}

/** "just now", "5m ago", "3h ago", "2d ago", or a date. */
export function timeAgo(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60e3) return "just now";
  if (diff < 3600e3) return `${Math.floor(diff / 60e3)}m ago`;
  if (diff < 864e5) return `${Math.floor(diff / 3600e3)}h ago`;
  if (diff < 7 * 864e5) return `${Math.floor(diff / 864e5)}d ago`;
  const p = dateParts(d);
  return `${p.day} ${p.month}`;
}

/** Ticket availability across all of an event's ticket types. */
export function availability(ticketTypes: readonly { quantity: number; sold: number }[]) {
  const capacity = ticketTypes.reduce((n, t) => n + t.quantity, 0);
  const left = ticketTypes.reduce((n, t) => n + Math.max(0, t.quantity - t.sold), 0);
  const soldOut = left <= 0;
  return { capacity, left, soldOut, sellingFast: !soldOut && (left <= 20 || left / capacity <= 0.2) };
}

/** Cheapest ticket price in kobo (0 = free). */
export function lowestPrice(ticketTypes: readonly { priceKobo: number }[]) {
  return ticketTypes.length ? Math.min(...ticketTypes.map((t) => t.priceKobo)) : 0;
}

/** True once an event is over (6 hours after it starts if it has no end time). */
export function hasEnded(event: { startsAt: Date; endsAt: Date | null }) {
  const end = event.endsAt?.getTime() ?? event.startsAt.getTime() + 6 * 3600e3;
  return Date.now() > end;
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}
