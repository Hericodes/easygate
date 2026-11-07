import { prisma } from "./db";

/** All of a user's orders, newest first, plus summary totals. */
export async function getOrderHistory(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      event: { select: { title: true, slug: true, venue: true, startsAt: true } },
      ticketType: { select: { name: true } },
      tickets: { select: { checkedInAt: true } },
    },
  });
  const paid = orders.filter((o) => o.status === "PAID");
  const attendedEvents = new Set(
    paid.filter((o) => o.tickets.some((t) => t.checkedInAt)).map((o) => o.eventId),
  );
  return {
    orders,
    summary: {
      totalSpentKobo: paid.reduce((n, o) => n + o.amountKobo, 0),
      ticketsBought: paid.reduce((n, o) => n + o.quantity, 0),
      eventsAttended: attendedEvents.size,
    },
  };
}
