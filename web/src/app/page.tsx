import Link from "next/link";
import CategoryNavigation from "@/components/CategoryNavigation";
import EmptyState from "@/components/EmptyState";
import EventGrid from "@/components/EventGrid";
import HeroSection from "@/components/HeroSection";
import InstallBanner from "@/components/InstallBanner";
import { CalendarIcon, ChevronRightIcon, ScanIcon, TicketIcon } from "@/components/icons";
import { getCurrentUser, isOrganizer } from "@/lib/auth";
import { listUpcomingEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, events] = await Promise.all([getCurrentUser(), listUpcomingEvents({})]);
  const organizer = isOrganizer(user);
  const upcoming = events.slice(0, 6);

  return (
    <div className="space-y-7 sm:space-y-10">
      <HeroSection />

      <CategoryNavigation />

      <section aria-labelledby="upcoming-heading">
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <h2 id="upcoming-heading" className="text-xl font-extrabold sm:text-2xl">
            Upcoming Events
          </h2>
          {events.length > upcoming.length && (
            <Link
              href="/events"
              className="inline-flex items-center gap-0.5 py-1 text-sm font-bold text-brand-600 transition-colors hover:text-brand-800"
            >
              See All <ChevronRightIcon className="h-4 w-4" strokeWidth={2.4} />
            </Link>
          )}
        </div>
        <EventGrid
          events={upcoming}
          empty={
            <EmptyState
              icon={<CalendarIcon className="h-7 w-7" />}
              title="No upcoming events yet"
              text="New events at OOU will show up here as soon as organizers publish them. Check back soon."
            >
              {organizer ? (
                <Link href="/organizer/events/new" className="btn-primary">
                  Create an event
                </Link>
              ) : (
                <Link href="/organizers/apply" className="btn-ghost">
                  Hosting an event? Sell tickets here
                </Link>
              )}
            </EmptyState>
          }
        />
      </section>

      <HostBanner organizer={organizer} />

      <InstallBanner />
    </div>
  );
}

/** A short pitch for organizers, with a real next step. */
function HostBanner({ organizer }: { organizer: boolean }) {
  return (
    <section className="hero-surface relative isolate overflow-hidden rounded-[28px] p-6 text-white sm:p-9">
      <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-pink-500/30 blur-3xl" />
      <div className="relative z-10 max-w-lg">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-200">For organizers</p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">Hosting an event at OOU?</h2>
        <p className="mt-2 text-sm text-white/75 sm:text-base">
          Sell tickets online, stop fake tickets at the gate, and check guests in with your phone camera.
        </p>
        <Link href={organizer ? "/organizer/events/new" : "/organizers/apply"} className="btn-white mt-5">
          {organizer ? "Create an event" : "Become an organizer"}
        </Link>
      </div>
      <div aria-hidden className="pointer-events-none absolute -bottom-6 right-4 hidden rotate-[-10deg] sm:block">
        <div className="grid h-28 w-44 place-items-center rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
          <TicketIcon className="h-14 w-14 text-white/70" strokeWidth={1.4} />
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute bottom-8 right-44 hidden rotate-[8deg] lg:block">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
          <ScanIcon className="h-9 w-9 text-white/70" strokeWidth={1.6} />
        </div>
      </div>
    </section>
  );
}
