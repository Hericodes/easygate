import { CrowdSilhouette } from "./Art";
import TicketQr from "./TicketQr";
import { CircleCheckIcon, TicketIcon } from "./icons";
import { dateParts, eventDate, hasEnded } from "@/lib/format";

/**
 * The full digital ticket: event, holder, type, reference and the scannable QR code.
 * The QR encodes the real ticket code, which the organizer's scanner checks against the database.
 */
export default function QRCodeTicket({
  code,
  qr,
  holder,
  ticketType,
  checkedInAt,
  event,
}: {
  code: string;
  qr: string;
  holder: string;
  ticketType: string;
  checkedInAt: Date | null;
  event: { title: string; venue: string; startsAt: Date; endsAt: Date | null };
}) {
  const d = dateParts(event.startsAt);
  const status = checkedInAt ? "used" : hasEnded(event) ? "ended" : "valid";

  return (
    <div className="ticket-shadow animate-fade-up">
      <div className="ticket-top hero-surface relative overflow-hidden rounded-t-[28px] px-6 pb-8 pt-6 text-white">
        <CrowdSilhouette className="absolute inset-x-0 bottom-0 h-16 w-full text-[#12042a]/60" />
        <div className="relative flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
          <span>Jiivent · Admit one</span>
          <TicketIcon className="h-5 w-5" />
        </div>
        <h1 className="relative mt-3 text-2xl font-extrabold leading-tight">{event.title}</h1>
        <dl className="relative mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Field label="Date" value={`${d.weekday}, ${d.day} ${d.month} ${d.year}`} />
          <Field label="Time" value={d.time} />
          <Field label="Venue" value={event.venue} wide />
        </dl>
      </div>

      <div className="ticket-bottom relative rounded-b-[28px] bg-white px-6 pb-7 pt-7">
        <div aria-hidden className="absolute inset-x-6 top-0 border-t-2 border-dashed border-line" />
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div className="min-w-0">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Ticket holder</dt>
            <dd className="mt-0.5 truncate font-bold text-ink">{holder}</dd>
          </div>
          <div className="min-w-0 text-right">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Ticket type</dt>
            <dd className="mt-0.5 truncate font-bold text-ink">{ticketType}</dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-center rounded-3xl bg-page py-5 ring-1 ring-line">
          <TicketQr src={qr} code={code} title={event.title} usedLabel={checkedInAt ? eventDate(checkedInAt) : undefined} size="lg" />
        </div>

        <p className="mt-5 text-center font-mono text-lg font-bold tracking-[0.2em] text-ink">{code}</p>
        <p className="text-center text-xs text-muted">Ticket reference</p>

        <div className="mt-4 flex justify-center">
          {status === "valid" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700">
              <CircleCheckIcon className="h-4 w-4" /> Valid · ready to scan
            </span>
          ) : status === "used" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-1.5 text-sm font-semibold text-zinc-600">
              Used · scanned {checkedInAt ? eventDate(checkedInAt) : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-1.5 text-sm font-semibold text-zinc-600">
              This event has ended
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-white/60">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
