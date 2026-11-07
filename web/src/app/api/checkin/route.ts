import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";

const schema = z.object({
  eventId: z.string().min(1),
  code: z.string().trim().toUpperCase().min(4),
});

/**
 * Validates a scanned ticket for an event and checks it in.
 * result: VALID (now checked in) | ALREADY_USED | WRONG_EVENT | NOT_FOUND
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Log in first", 401);
    const { eventId, code } = schema.parse(await req.json());

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return jsonError("Event not found", 404);
    if (event.organizerId !== user.id && user.role !== "ADMIN") {
      return jsonError("You can only check in guests for your own events", 403);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { code },
      include: { user: { select: { name: true } }, ticketType: { select: { name: true } } },
    });
    if (!ticket) return NextResponse.json({ result: "NOT_FOUND", code });
    const info = {
      code,
      holder: ticket.user.name,
      ticketType: ticket.ticketType.name,
    };
    if (ticket.eventId !== eventId) return NextResponse.json({ result: "WRONG_EVENT", ...info });

    // Conditional update so two doors scanning the same code can't both admit it.
    const updated = await prisma.ticket.updateMany({
      where: { id: ticket.id, checkedInAt: null },
      data: { checkedInAt: new Date() },
    });
    if (updated.count === 0) {
      const fresh = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      return NextResponse.json({ result: "ALREADY_USED", checkedInAt: fresh?.checkedInAt, ...info });
    }
    return NextResponse.json({ result: "VALID", ...info });
  } catch (err) {
    return handleError(err);
  }
}
