import Link from "next/link";
import CategoryIcon from "@/components/CategoryIcon";
import EmptyState from "@/components/EmptyState";
import EventCard from "@/components/EventCard";
import InstallBanner from "@/components/InstallBanner";
import {
  CheckIcon,
  LockIcon,
  MusicIcon,
  PartyIcon,
  QrIcon,
  SearchIcon,
  ShieldCheckIcon,
  TicketIcon,
} from "@/components/icons";
import { listUpcomingEvents } from "@/lib/events";
import { CATEGORIES } from "@/lib/format";

export const dynamic = "force-dynamic";

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const events = await listUpcomingEvents({ q: sp.q, category: sp.category });
  const filtered = Boolean(sp.q || sp.category);

  const chipHref = (category?: string) => {
    const p = new URLSearchParams();
    if (sp.q) p.set("q", sp.q);
    if (category) p.set("category", category);
    const qs = p.toString();
    return `/${qs ? `?${qs}` : ""}#events`;
  };

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-white shadow-2xl shadow-brand-900/20 sm:px-12 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-blob absolute -left-24 -top-28 h-80 w-80 rounded-full bg-brand-500/70 blur-3xl" />
          <div className="animate-blob absolute -right-20 top-6 h-72 w-72 rounded-full bg-hot/50 blur-3xl" style={delay(-6000)} />
          <div className="animate-blob absolute -bottom-36 left-1/3 h-80 w-80 rounded-full bg-sun/40 blur-3xl" style={delay(-12000)} />
          <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black_30%,transparent)]" />
        </div>
        <HeroTicket />

        <div className="relative max-w-2xl">
          <p className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            OOU&apos;s home for event tickets
          </p>
          <h1 className="animate-fade-up font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl" style={delay(80)}>
            Find what&apos;s happening <span className="gradient-text-light animate-gradient">at OOU.</span> Get your
            ticket in seconds.
          </h1>
          <p className="animate-fade-up mt-5 max-w-xl text-base text-zinc-300 sm:text-lg" style={delay(160)}>
            No more asking around for who&apos;s selling. Browse events, pay securely, and walk in with a QR code on
            your phone.
          </p>

          <form
            action="/"
            className="animate-fade-up mt-8 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30"
            style={delay(240)}
          >
            <SearchIcon className="ml-2 h-5 w-5 shrink-0 text-zinc-400" />
            <input
              name="q"
              defaultValue={sp.q}
              aria-label="Search events"
              placeholder="Search parties, concerts, venues…"
              className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-base text-ink outline-none placeholder:text-zinc-400 sm:text-sm"
            />
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            <button className="btn-primary px-5">Search</button>
          </form>

          <ul className="animate-fade-up mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-300" style={delay(320)}>
            <li className="flex items-center gap-2">
              <QrIcon className="h-4 w-4 text-accent" /> Instant QR tickets
            </li>
            <li className="flex items-center gap-2">
              <LockIcon className="h-4 w-4 text-accent" /> Secure Paystack checkout
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-accent" /> Verified organizers
            </li>
          </ul>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {filtered ? "Results" : "Upcoming events"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {events.length === 1 ? "1 event" : `${events.length} events`}
              {sp.q ? ` matching “${sp.q}”` : ""}
            </p>
          </div>
          {filtered && (
            <Link href="/#events" className="text-sm font-semibold text-brand-600 hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        <div className="no-scrollbar -mx-4 mb-7 flex gap-2 overflow-x-auto px-4 pb-2 pt-1">
          <CategoryChip href={chipHref()} active={!sp.category}>
            All events
          </CategoryChip>
          {CATEGORIES.map((c) => (
            <CategoryChip key={c.value} href={chipHref(c.value)} active={sp.category === c.value}>
              <CategoryIcon category={c.value} className="h-4 w-4" />
              {c.short}
            </CategoryChip>
          ))}
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="h-7 w-7" />}
            title="No events found"
            text="Try another search or category, or check back soon."
          >
            {filtered && (
              <Link href="/#events" className="btn-ghost">
                Show all events
              </Link>
            )}
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        )}
      </section>

      <InstallBanner />
    </div>
  );
}

function CategoryChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition duration-200 ${
        active
          ? "brand-gradient text-white shadow-lg shadow-brand-500/30"
          : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:-translate-y-0.5 hover:text-brand-700 hover:ring-brand-300"
      }`}
    >
      {children}
    </Link>
  );
}

/** Decorative floating ticket + glass icon tiles on the right of the hero (wide screens only). */
function HeroTicket() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] xl:block">
      <div className="absolute right-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-brand-500/30 blur-3xl" />

      <div className="animate-float absolute right-16 top-[16%] w-64" style={{ "--r": "8deg" } as React.CSSProperties}>
        <div className="ticket-top brand-gradient animated-gradient rounded-t-3xl p-5 pb-6 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">Admit one</span>
            <TicketIcon className="h-5 w-5 text-white/80" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold leading-tight">Freshers&apos; Night</p>
          <p className="mt-1 text-sm text-white/85">Fri · 9:00 pm · Main Campus</p>
        </div>
        <div className="ticket-bottom relative rounded-b-3xl bg-white p-5 pt-6">
          <div className="absolute inset-x-5 top-0 border-t-2 border-dashed border-zinc-200" />
          <div className="flex items-center gap-4">
            <QrIcon strokeWidth={1.75} className="h-20 w-20 shrink-0 text-ink" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Ticket code</p>
              <p className="font-mono text-sm font-bold tracking-wider text-ink">EG-7KQ2M9</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <CheckIcon className="h-3 w-3" /> Valid
              </span>
            </div>
          </div>
        </div>
      </div>

      <GlassTile className="right-[72%] top-[22%]" rotate="-12deg" delayMs={-2000}>
        <MusicIcon className="h-7 w-7" />
      </GlassTile>
      <GlassTile className="bottom-[10%] right-[54%]" rotate="10deg" delayMs={-4000}>
        <PartyIcon className="h-7 w-7" />
      </GlassTile>
    </div>
  );
}

function GlassTile({
  className,
  rotate,
  delayMs,
  children,
}: {
  className: string;
  rotate: string;
  delayMs: number;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`animate-float absolute grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-md ${className}`}
      style={{ animationDelay: `${delayMs}ms`, "--r": rotate } as React.CSSProperties}
    >
      {children}
    </span>
  );
}
