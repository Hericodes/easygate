import crypto from "crypto";
import { prisma } from "./db";

// No 0/O/1/I so codes are easy to read out at the door.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newTicketCode() {
  const bytes = crypto.randomBytes(10);
  let out = "EG-";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function newReference() {
  return "EG_" + Date.now().toString(36) + "_" + crypto.randomBytes(5).toString("hex");
}

/**
 * Marks an order paid and issues its tickets. Idempotent: safe to call from
 * both the Paystack redirect and the webhook for the same order.
 * Returns false if the ticket type sold out before payment completed.
 */
export async function fulfillOrder(reference: string, paidAmountKobo?: number) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { reference } });
    if (!order) throw new Error("Order not found");
    if (order.status === "PAID") return true;
    if (paidAmountKobo !== undefined && paidAmountKobo < order.amountKobo) {
      await tx.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return false;
    }

    // Reserve seats atomically: only succeeds if enough are left.
    const tt = await tx.ticketType.findUniqueOrThrow({ where: { id: order.ticketTypeId } });
    const reserved = await tx.ticketType.updateMany({
      where: { id: tt.id, sold: { lte: tt.quantity - order.quantity } },
      data: { sold: { increment: order.quantity } },
    });
    if (reserved.count === 0) {
      // Sold out after payment: needs a refund from the Paystack dashboard.
      await tx.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return false;
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    for (let i = 0; i < order.quantity; i++) {
      await tx.ticket.create({
        data: {
          code: newTicketCode(),
          orderId: order.id,
          userId: order.userId,
          eventId: order.eventId,
          ticketTypeId: order.ticketTypeId,
        },
      });
    }
    return true;
  });
}
