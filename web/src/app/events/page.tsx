import Link from "next/link";
import CategoryNavigation from "@/components/CategoryNavigation";
import EmptyState from "@/components/EmptyState";
import EventGrid from "@/components/EventGrid";
import SearchBar from "@/components/SearchBar";
import { SearchIcon } from "@/components/icons";
import { listUpcomingEvents } from "@/lib/events";
import { CATEGORIES } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const category = CATEGORIES.some((c) => c.value === sp.category) ? sp.category : undefined;
  const events = await listUpcomingEvents({ q, category });
  const catLabel = category ? CATEGORIES.find((c) => c.value === category)?.short : null;
  const filtered = Boolean(q || category);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          {q ? <>Results for “{q}”</> : catLabel ? catLabel : "Explore events"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {events.length === 1 ? "1 upcoming event" : `${events.length} upcoming events`}
          {catLabel && q ? ` in ${catLabel}` : ""} at OOU
        </p>
      </div>

      <SearchBar q={q} category={category} />
      <CategoryNavigation active={category ?? "ALL"} q={q} />

      <EventGrid
        events={events}
        empty={
          <EmptyState
            icon={<SearchIcon className="h-7 w-7" />}
            title={filtered ? "No events match" : "No upcoming events yet"}
            text={
              filtered
                ? "Try a different search or category."
                : "New events at OOU will show up here as soon as organizers publish them."
            }
          >
            {filtered && (
              <Link href="/events" className="btn-ghost">
                Show all events
              </Link>
            )}
          </EmptyState>
        }
      />
    </div>
  );
}
