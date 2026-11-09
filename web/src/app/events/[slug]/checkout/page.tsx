import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { dateParts, hasEnded } from "@/lib/format";
import CheckoutForm from "@/components/CheckoutForm";
import EmptyState from "@/components/EmptyState";
import EventCover from "@/components/EventCover";
import { CalendarIcon, CheckIcon, ChevronLeftIcon, MapPinIcon, TicketIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; qty?: string }>;
}) {
  const { slug } = await params;
  const { type, qty } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/events/${slug}/checkout${type ? `?type=${type}` : ""}`)}`);

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { ticketTypes: { orderBy: { priceKobo: "asc" } } },
  });
  if (!event || !event.published) notFound();

  const types = event.ticketTypes.map((t) => ({
    id: t.id,
    name: t.name,
    priceKobo: t.priceKobo,
    left: Math.max(0, t.quantity - t.sold),
  }));
  const selected = types.find((t) => t.id === type && t.left > 0) ?? types.find((t) => t.left > 0);
  const d = dateParts(event.startsAt);
  const back = `/events/${event.slug}`;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <Link href={back} className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-muted transition-colors hover:text-brand-600">
          <ChevronLeftIcon className="h-4 w-4" strokeWidth={2.4} /> Back to event
        </Link>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Checkout</h1>
        <Steps />
      </div>

      <section className="card animate-fade-up flex gap-4 p-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
          <EventCover title={event.title} category={event.category} imageUrl={event.imageUrl} size="sm" />
        </div>
        <div className="min-w-0 py-1">
          <p className="line-clamp-2 text-base font-extrabold leading-snug text-ink sm:text-lg">{event.title}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <CalendarIcon className="h-4 w-4 shrink-0" /> {d.weekday}, {d.day} {d.month} {d.year} • {d.time}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <MapPinIcon className="h-4 w-4 shrink-0" /> <span className="truncate">{event.venue}</span>
          </p>
        </div>
      </section>

      {hasEnded(event) ? (
        <EmptyState icon={<CalendarIcon className="h-7 w-7" />} title="This event has ended" text="Tickets are no longer on sale.">
          <Link href="/events" className="btn-primary">Find other events</Link>
        </EmptyState>
      ) : !selected ? (
        <EmptyState icon={<TicketIcon className="h-7 w-7" />} title="Sold out" text="Every ticket for this event has been taken.">
          <Link href="/events" className="btn-primary">Find other events</Link>
        </EmptyState>
      ) : (
        <CheckoutForm
          ticketTypes={types}
          initialTypeId={selected.id}
          initialQty={Math.min(Math.max(1, Number(qty) || 1), Math.min(10, selected.left))}
          email={user.email}
        />
      )}
    </div>
  );
}

function Steps() {
  const steps = ["Choose tickets", "Pay securely", "Get your QR ticket"];
  return (
    <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full ${
              i === 0 ? "primary-gradient text-white" : i === 1 ? "bg-brand-100 text-brand-700" : "bg-white text-muted ring-1 ring-line"
            }`}
          >
            {i === 0 ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
          </span>
          <span className={i === 1 ? "text-ink" : "text-muted"}>{s}</span>
          {i < steps.length - 1 && <span aria-hidden className="h-px w-5 bg-line" />}
        </li>
      ))}
    </ol>
  );
}
