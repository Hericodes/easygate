import QRCode from "qrcode";
import { prisma } from "./db";

export async function getUserTickets(userId: string) {
  const tickets = await prisma.ticket.findMany({
    where: { userId },
    include: {
      event: {
        select: { title: true, slug: true, venue: true, campus: true, startsAt: true, category: true },
      },
      ticketType: { select: { name: true } },
    },
    orderBy: { event: { startsAt: "asc" } },
  });
  return Promise.all(
    tickets.map(async (t) => ({
      ...t,
      qr: await QRCode.toDataURL(t.code, { margin: 1, width: 240 }),
    })),
  );
}
