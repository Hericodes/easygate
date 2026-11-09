import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasEnded } from "@/lib/format";
import QRCodeTicket from "@/components/QRCodeTicket";
import { ChevronLeftIcon, DownloadIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/tickets/${code}`)}`);

  const ticket = await prisma.ticket.findUnique({
    where: { code },
    include: {
      event: { select: { title: true, slug: true, venue: true, startsAt: true, endsAt: true } },
      ticketType: { select: { name: true } },
    },
  });
  // Only the ticket's owner can see it.
  if (!ticket || ticket.userId !== user.id) notFound();

  const qr = await QRCode.toDataURL(ticket.code, { margin: 1, width: 480 });
  const valid = !ticket.checkedInAt && !hasEnded(ticket.event);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link href="/tickets" className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-muted transition-colors hover:text-brand-600">
        <ChevronLeftIcon className="h-4 w-4" strokeWidth={2.4} /> My Tickets
      </Link>

      <QRCodeTicket
        code={ticket.code}
        qr={qr}
        holder={user.name}
        ticketType={ticket.ticketType.name}
        checkedInAt={ticket.checkedInAt}
        event={ticket.event}
      />

      <div className="grid grid-cols-2 gap-3">
        {valid && (
          <a href={`/api/tickets/${ticket.code}/image`} download={`EasyGate-${ticket.code}.png`} className="btn-primary py-3">
            <DownloadIcon className="h-4 w-4" /> Save to phone
          </a>
        )}
        <Link href={`/events/${ticket.event.slug}`} className={`btn-ghost py-3 ${valid ? "" : "col-span-2"}`}>
          View event
        </Link>
      </div>
      {valid && (
        <p className="text-center text-xs text-muted">
          Tip: turn your screen brightness up at the gate. A saved copy works even without data.
        </p>
      )}
    </div>
  );
}
