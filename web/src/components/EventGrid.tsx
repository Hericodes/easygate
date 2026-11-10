import EventCard, { type EventCardData } from "./EventCard";

/** Event posters: two per row on phones, up to four on wide screens. Pass `empty` for when there are none. */
export default function EventGrid({ events, empty }: { events: (EventCardData & { id: string })[]; empty: React.ReactNode }) {
  if (!events.length) return <>{empty}</>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
      {events.map((e, i) => (
        <EventCard key={e.id} event={e} index={i} />
      ))}
    </div>
  );
}
