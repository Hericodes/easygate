import EventCard, { type EventCardData } from "./EventCard";

/** Event cards in one column on phones, two from tablet size up. Pass `empty` for when there are none. */
export default function EventGrid({ events, empty }: { events: (EventCardData & { id: string })[]; empty: React.ReactNode }) {
  if (!events.length) return <>{empty}</>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {events.map((e, i) => (
        <EventCard key={e.id} event={e} index={i} />
      ))}
    </div>
  );
}
