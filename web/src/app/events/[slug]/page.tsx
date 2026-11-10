import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { imageIdFromUrl } from "@/lib/images";
import { availability, categoryMeta, dateParts, lowestPrice, naira } from "@/lib/format";
import Avatar from "@/components/Avatar";
import CategoryIcon from "@/components/CategoryIcon";
import Countdown from "@/components/Countdown";
import EventCover from "@/components/EventCover";
import FlyerViewer from "@/components/FlyerViewer";
import MobileBuyBar from "@/components/MobileBuyBar";
import ShareButton from "@/components/ShareButton";
import TicketOptions from "@/components/TicketOptions";
import { AlertIcon, CalendarIcon, ChevronLeftIcon, MapPinIcon, ShieldCheckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

// Shared by the page and its link-preview details, so the event is only loaded once per request.
const getEvent = cache((slug: string) =>
  prisma.event.findUnique({
    where: { slug },
    include: { ticketTypes: { orderBy: { priceKobo: "asc" } }, organizer: { select: { name: true, avatarUrl: true } } },
  }),
);

/** What WhatsApp, X, Facebook and others show when the event link is shared: title, when/where/price and the flyer. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event || !event.published || event.status !== "APPROVED") {
    return { title: "Event · EasyGate", robots: { index: false } };
  }
  const d = dateParts(event.startsAt);
  const price = lowestPrice(event.ticketTypes);
  const description = `${d.weekday}, ${d.day} ${d.month} · ${d.time} at ${event.venue}. ${
    price === 0 ? "Free entry" : `Tickets from ${naira(price)}`
  } on EasyGate.`;
  // The version changes when the flyer does, so apps fetch the new picture instead of a cached one.
  const version = imageIdFromUrl(event.imageUrl) ?? (event.imageUrl ? "link" : "card");
  const image = {
    url: `/api/events/${event.slug}/share-image?v=${version}`,
    width: 1200,
    height: 630,
    alt: event.imageUrl ? `${event.title} flyer` : event.title,
    type: "image/jpeg",
  };
  return {
    title: `${event.title} · EasyGate`,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { type: "website", siteName: "EasyGate", title: event.title, description, url: `/events/${event.slug}`, images: [image] },
    twitter: { card: "summary_large_image", title: event.title, description, images: [image] },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, user] = await Promise.all([getEvent(slug), getCurrentUser()]);
  if (!event || !event.published) notFound();
  // Events waiting for review (or rejected) are only visible to their organizer and admins.
  const approved = event.status === "APPROVED";
  const canPreview = Boolean(user && (event.organizerId === user.id || isAdmin(user)));
  if (!approved && !canPreview) notFound();

  const cat = categoryMeta(event.category);
  const start = dateParts(event.startsAt);
  const end = event.endsAt ? dateParts(event.endsAt) : null;
  const { soldOut } = availability(event.ticketTypes);
  const price = lowestPrice(event.ticketTypes);

  return (
    <div>
      {!approved && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p>
            <span className="font-bold">Preview only. </span>
            {event.status === "PENDING"
              ? "This event is waiting for admin review. Students can't see it or buy tickets yet."
              : `This event wasn't approved${event.reviewNote ? `: ${event.reviewNote}` : "."} Students can't see it.`}
          </p>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <article className="min-w-0 space-y-5">
          {/* Cover */}
          <div className="animate-fade-in relative -mx-4 -mt-2 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-[28px]">
            {event.imageUrl ? (
              // The flyer as a poster on a blurred copy of itself, clear of the card that overlaps the bottom.
              <div className="relative h-[460px] bg-[#150833] sm:h-[540px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.imageUrl}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-3xl saturate-150"
                />
                <div aria-hidden className="absolute inset-0 bg-linear-to-b from-black/45 via-black/10 to-black/40" />
                <div className="absolute inset-x-5 bottom-[4.5rem] top-[4.25rem] flex justify-center sm:bottom-24 sm:top-16">
                  <FlyerViewer src={event.imageUrl} title={event.title} />
                </div>
              </div>
            ) : (
              <div className="relative h-[270px] sm:h-[380px]">
                <EventCover title={event.title} category={event.category} size="lg" showTitle={false} />
                <div aria-hidden className="absolute inset-0 bg-linear-to-b from-black/35 via-transparent to-black/25" />
              </div>
            )}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
              <Link
                href="/events"
                aria-label="Back to events"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-md transition active:scale-95"
              >
                <ChevronLeftIcon className="h-5 w-5" strokeWidth={2.4} />
              </Link>
              <ShareButton title={event.title} />
            </div>
          </div>

          {/* Title, countdown, when/where, organizer */}
          <div className="card animate-fade-up relative -mt-12 p-5 sm:-mt-16 sm:mx-4 sm:p-7">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cat.tile}`}>
              <CategoryIcon category={event.category} className="h-3.5 w-3.5" />
              {cat.label}
            </span>
            <h1 className="mt-2.5 text-2xl font-extrabold leading-tight sm:text-[2rem]">{event.title}</h1>
            <div className="mt-4">
              <Countdown startsAt={event.startsAt.toISOString()} endsAt={event.endsAt?.toISOString() ?? null} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoRow
                icon={<CalendarIcon className="h-5 w-5" />}
                label="Date & time"
                title={`${start.weekday}, ${start.day} ${start.month} ${start.year}`}
                sub={end ? `${start.time} – ${end.time}` : `Starts at ${start.time}`}
              />
              <InfoRow
                icon={<MapPinIcon className="h-5 w-5" />}
                label="Venue"
                title={event.venue}
                sub="Olabisi Onabanjo University"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <Avatar name={event.organizer.name} src={event.organizer.avatarUrl} />
              <div className="min-w-0">
                <p className="text-xs text-muted">Organized by</p>
                <p className="truncate font-bold text-ink">{event.organizer.name}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <ShieldCheckIcon className="h-4 w-4" /> Verified organizer
              </span>
            </div>
          </div>

          <section className="card animate-fade-up p-5 sm:p-7" style={{ animationDelay: "80ms" }}>
            <h2 className="text-lg font-extrabold">About this event</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink/80">{event.description}</p>
          </section>
        </article>

        <aside
          id="tickets"
          className="animate-fade-up scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
          style={{ animationDelay: "120ms" }}
        >
          {approved ? (
            <TicketOptions slug={event.slug} ticketTypes={event.ticketTypes} loggedIn={Boolean(user)} />
          ) : (
            <div className="card p-5 text-sm text-muted">
              <h2 className="text-lg font-extrabold text-ink">Tickets</h2>
              <p className="mt-1">Tickets go on sale as soon as an admin approves this event.</p>
            </div>
          )}
        </aside>
      </div>

      {approved && !soldOut && <MobileBuyBar targetId="tickets" label={price === 0 ? "Free entry" : `From ${naira(price)}`} />}
    </div>
  );
}

function InfoRow({ icon, label, title, sub }: { icon: React.ReactNode; label: string; title: string; sub: string }) {
  return (
    <div className="flex gap-3.5 rounded-2xl bg-page p-3.5 ring-1 ring-line">
      <span className="primary-gradient grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-md shadow-brand-600/25">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-0.5 font-bold leading-snug text-ink">{title}</p>
        <p className="text-sm text-muted">{sub}</p>
      </div>
    </div>
  );
}
