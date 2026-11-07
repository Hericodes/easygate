import Link from "next/link";
import { requireOwnEvent } from "@/lib/organizer";
import Scanner from "@/components/Scanner";

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event } = await requireOwnEvent(id);
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <Link
          href={`/organizer/events/${id}`}
          className="inline-block py-2 text-sm font-medium text-zinc-500 transition-colors hover:text-brand-700"
        >
          ← {event.title}
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight">Check-in scanner</h1>
        <p className="text-sm text-zinc-500">Point the camera at a guest&apos;s QR code, or type the code.</p>
      </div>
      <Scanner eventId={id} />
    </div>
  );
}
