import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { categoryMeta, dateParts } from "@/lib/format";

/**
 * The signed-in owner's ticket as a PNG, for saving to the phone.
 * It works offline at the gate: the QR in the picture is the real ticket code.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Log in first", { status: 401 });
  const { code } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { code },
    include: {
      event: { select: { title: true, venue: true, startsAt: true, category: true } },
      ticketType: { select: { name: true } },
    },
  });
  if (!ticket || ticket.userId !== user.id) return new Response("Not found", { status: 404 });

  const qr = await QRCode.toDataURL(ticket.code, { margin: 1, width: 680 });
  const d = dateParts(ticket.event.startsAt);
  const [from, to] = categoryMeta(ticket.event.category).hex;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#14121f", padding: 36 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            borderRadius: 36,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "36px 40px",
              color: "#ffffff",
              backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
            }}
          >
            <div style={{ display: "flex", fontSize: 18, letterSpacing: 4, opacity: 0.85 }}>JIIVENT · ADMIT ONE</div>
            <div style={{ display: "flex", fontSize: 44, lineHeight: 1.15, marginTop: 14 }}>{ticket.event.title}</div>
            <div style={{ display: "flex", fontSize: 22, marginTop: 14, opacity: 0.92 }}>
              {`${d.weekday}, ${d.day} ${d.month} · ${d.time}`}
            </div>
            <div style={{ display: "flex", fontSize: 22, marginTop: 6, opacity: 0.92 }}>{ticket.event.venue}</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexGrow: 1,
              padding: "34px 40px 30px",
              borderTop: "4px dashed #e4e4e7",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img src={qr} width={340} height={340} />
            <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, marginTop: 20, color: "#14121f" }}>
              {ticket.code}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                marginTop: 14,
                color: "#4824cc",
                backgroundColor: "#f3f0ff",
                padding: "8px 20px",
                borderRadius: 999,
              }}
            >
              {ticket.ticketType.name}
            </div>
            <div style={{ display: "flex", marginTop: "auto", fontSize: 18, color: "#71717a" }}>
              Show this QR code at the gate.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 960,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="Jiivent-${ticket.code}.png"`,
      },
    },
  );
}
