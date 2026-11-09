import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { requireOrganizer } from "@/lib/organizer";
import EventForm from "@/components/EventForm";
import { ChevronLeftIcon, ShieldCheckIcon } from "@/components/icons";

export default async function NewEventPage() {
  const user = await requireOrganizer();
  const autoApprove = isAdmin(user);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/organizer" className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-muted transition-colors hover:text-brand-600">
          <ChevronLeftIcon className="h-4 w-4" strokeWidth={2.4} /> Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Create an event</h1>
      </div>
      {!autoApprove && (
        <p className="flex items-start gap-3 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          An EasyGate admin reviews every new event before students can see it, usually within 24 hours. You&apos;ll get
          a notification when it&apos;s live.
        </p>
      )}
      <EventForm autoApprove={autoApprove} />
    </div>
  );
}
