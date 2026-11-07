import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { categoryMeta, dateParts, naira } from "@/lib/format";
import Avatar from "@/components/Avatar";
import BuyTickets from "@/components/BuyTickets";
import MobileBuyBar from "@/components/MobileBuyBar";
import ShareButton from "@/components/ShareButton";
import CategoryIcon from "@/components/CategoryIcon";
import Countdown from "@/components/Countdown";
import { CalendarIcon, MapPinIcon, ShieldCheckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, user] = await Promise.all([
    prisma.event.findUnique({
      where: { slug },
      include: { ticketTypes: { orderBy: { priceKobo: "asc" } }, organizer: { select: { name: true } } },
    }),
    getCurrentUser(),
  ]);
  if (!event || !event.published) notFound();

  const cat = categoryMeta(event.category);
  const start = dateParts(event.startsAt);
  const end = event.endsAt ? dateParts(event.endsAt) : null;
  const minPrice = event.ticketTypes[0]?.priceKobo ?? 0; // sorted cheapest first
  const soldOut = event.ticketTypes.every((t) => t.quantity - t.sold <= 0);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <section className={`animate-fade-in relative isolate overflow-hidden rounded-[2rem] bg-linear-to-br ${cat.gradient}`}>
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        ) : (
          <>
            <div aria-hidden className="dot-pattern absolute inset-0 -z-10 opacity-40" />
            <div aria-hidden className="absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full border-[48px] border-white/10" />
            <div aria-hidden className="absolute -bottom-24 left-1/4 -z-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <CategoryIcon
              category={event.category}
              strokeWidth={1.25}
              className="animate-float absolute right-6 top-6 -z-10 h-36 w-36 text-white/35 sm:right-16 sm:top-10 sm:h-56 sm:w-56"
            />
          </>
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ShareButton title={event.title} />
        </div>

        <div className="flex min-h-[20rem] flex-col justify-end gap-4 p-6 text-white sm:min-h-[24rem] sm:p-10">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <CategoryIcon category={event.category} className="h-3.5 w-3.5" />
            {cat.label}
          </span>
          <h1 className="max-w-3xl font-display text-3xl font-bold leading-[1.1] tracking-tight drop-shadow sm:text-5xl">
            {event.title}
          </h1>
          <Countdown startsAt={event.startsAt.toISOString()} endsAt={event.endsAt?.toISOString() ?? null} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <article className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoTile
              delay={100}
              icon={<CalendarIcon className="h-5 w-5" />}
              label="When"
              title={`${start.weekday}, ${start.day} ${start.month}`}
              sub={end ? `${start.time} – ${end.time}` : `Starts ${start.time}`}
            />
            <InfoTile
              delay={160}
              icon={<MapPinIcon className="h-5 w-5" />}
              label="Where"
              title={event.venue}
              sub="Olabisi Onabanjo University"
            />
          </div>

          <div className="card animate-fade-up p-6" style={{ animationDelay: "220ms" }}>
            <h2 className="mb-3 font-display text-xl font-bold">About this event</h2>
            <p className="whitespace-pre-line leading-relaxed text-zinc-700">{event.description}</p>
          </div>

          <div className="card animate-fade-up flex flex-wrap items-center gap-4 p-5" style={{ animationDelay: "280ms" }}>
            <Avatar name={event.organizer.name} />
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Hosted by</p>
              <p className="truncate font-semibold">{event.organizer.name}</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheckIcon className="h-4 w-4" /> Verified organizer
            </span>
          </div>
        </article>

        <aside
          id="get-tickets"
          className="animate-fade-up scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
          style={{ animationDelay: "150ms" }}
        >
          <BuyTickets
            loggedIn={Boolean(user)}
            slug={event.slug}
            ticketTypes={event.ticketTypes.map((t) => ({
              id: t.id,
              name: t.name,
              priceKobo: t.priceKobo,
              left: t.quantity - t.sold,
            }))}
          />
        </aside>
      </div>

      {!soldOut && <MobileBuyBar targetId="get-tickets" label={minPrice === 0 ? "Free entry" : `From ${naira(minPrice)}`} />}
    </div>
  );
}

function InfoTile({
  icon,
  label,
  title,
  sub,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  sub: string;
  delay: number;
}) {
  return (
    <div className="card animate-fade-up flex gap-4 p-5" style={{ animationDelay: `${delay}ms` }}>
      <span className="brand-gradient grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg shadow-brand-500/25">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="mt-0.5 font-semibold">{title}</p>
        <p className="text-sm text-zinc-500">{sub}</p>
      </div>
    </div>
  );
}
