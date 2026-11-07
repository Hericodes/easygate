// All events are at OOU, so dates and times always show in Nigerian time,
// whatever timezone the server runs in.
const TZ = "Africa/Lagos";

export const CATEGORIES = [
  {
    value: "PARTY",
    label: "Party",
    short: "Parties",
    gradient: "from-fuchsia-500 via-pink-500 to-orange-400",
    // Same gradient as plain colors, for generated images.
    hex: ["#d946ef", "#fb923c"],
    glow: "rgb(236 72 153 / 0.45)",
  },
  {
    value: "CONCERT",
    label: "Concert",
    short: "Concerts",
    gradient: "from-violet-600 via-purple-500 to-fuchsia-500",
    // Same gradient as plain colors, for generated images.
    hex: ["#7c3aed", "#d946ef"],
    glow: "rgb(139 92 246 / 0.45)",
  },
  {
    value: "CONFERENCE",
    label: "Conference / Talk",
    short: "Talks",
    gradient: "from-blue-600 via-indigo-500 to-cyan-400",
    // Same gradient as plain colors, for generated images.
    hex: ["#2563eb", "#22d3ee"],
    glow: "rgb(59 130 246 / 0.45)",
  },
  {
    value: "SPORTS",
    label: "Sports",
    short: "Sports",
    gradient: "from-emerald-500 via-green-500 to-lime-400",
    // Same gradient as plain colors, for generated images.
    hex: ["#10b981", "#a3e635"],
    glow: "rgb(34 197 94 / 0.45)",
  },
  {
    value: "RELIGIOUS",
    label: "Religious",
    short: "Religious",
    gradient: "from-amber-400 via-orange-400 to-rose-400",
    // Same gradient as plain colors, for generated images.
    hex: ["#fbbf24", "#fb7185"],
    glow: "rgb(251 146 60 / 0.45)",
  },
  {
    value: "OTHER",
    label: "Other",
    short: "Other",
    gradient: "from-slate-700 via-indigo-600 to-violet-500",
    // Same gradient as plain colors, for generated images.
    hex: ["#334155", "#8b5cf6"],
    glow: "rgb(99 102 241 / 0.45)",
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

/** Pieces of a date for badges: { day: "12", month: "Nov", weekday: "Wed", time: "8:00 pm" }. */
export function dateParts(d: Date | string) {
  const date = new Date(d);
  const f = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-NG", { timeZone: TZ, ...o }).format(date);
  return {
    day: f({ day: "numeric" }),
    month: f({ month: "short" }),
    weekday: f({ weekday: "short" }),
    time: f({ hour: "numeric", minute: "2-digit", hour12: true }),
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
