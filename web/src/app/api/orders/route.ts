import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";
import { fulfillOrder, newReference } from "@/lib/tickets";
import { initializeTransaction, paystackEnabled } from "@/lib/paystack";
import { getOrderHistory } from "@/lib/order-history";

/** The signed-in user's order history (used by the mobile app). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Log in first", 401);
  return NextResponse.json(await getOrderHistory(user.id));
}

const schema = z.object({
  ticketTypeId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10, "Max 10 tickets per order"),
});

/**
 * Starts a purchase. Returns { redirectUrl } to send the buyer to:
 * - free tickets: straight to /tickets
 * - paid + Paystack configured: Paystack checkout
 * - paid + no Paystack key (dev only): the mock checkout page
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Log in to get tickets", 401);

    const { ticketTypeId, quantity } = schema.parse(await req.json());
    const tt = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: true },
    });
    if (!tt || !tt.event.published) return jsonError("Ticket not found", 404);
    if (tt.event.startsAt < new Date(Date.now() - 6 * 60 * 60 * 1000)) {
      return jsonError("This event has ended");
    }
    if (tt.quantity - tt.sold < quantity) {
      return jsonError(tt.quantity - tt.sold <= 0 ? "Sold out" : "Not enough tickets left");
    }

    const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
    const order = await prisma.order.create({
      data: {
        reference: newReference(),
        quantity,
        amountKobo: tt.priceKobo * quantity,
        userId: user.id,
        eventId: tt.eventId,
        ticketTypeId: tt.id,
      },
    });

    if (order.amountKobo === 0) {
      const ok = await fulfillOrder(order.reference);
      if (!ok) return jsonError("Sold out");
      return NextResponse.json({ redirectUrl: `/tickets?ref=${order.reference}` });
    }

    if (paystackEnabled()) {
      const tx = await initializeTransaction({
        email: user.email,
        amountKobo: order.amountKobo,
        reference: order.reference,
        callbackUrl: `${appUrl}/api/payments/verify`,
        metadata: { orderId: order.id, event: tt.event.title, ticket: tt.name, quantity },
      });
      return NextResponse.json({ redirectUrl: tx.authorization_url });
    }

    if (process.env.NODE_ENV === "production") {
      return jsonError("Payments are not configured", 503);
    }
    return NextResponse.json({ redirectUrl: `/checkout/mock?reference=${order.reference}` });
  } catch (err) {
    return handleError(err);
  }
}
