import { requireOrganizer } from "@/lib/organizer";
import EventForm from "@/components/EventForm";

export default async function NewEventPage() {
  await requireOrganizer();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Create an event</h1>
      <EventForm />
    </div>
  );
}
