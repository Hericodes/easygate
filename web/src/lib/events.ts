import { prisma } from "./db";

export type EventFilters = { q?: string; campus?: string; category?: string };

/** Upcoming published events, soonest first. Shared by the home page and GET /api/events. */
export function listUpcomingEvents(f: EventFilters) {
  return prisma.event.findMany({
    where: {
      published: true,
      startsAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      ...(f.campus ? { campus: f.campus } : {}),
      ...(f.category ? { category: f.category } : {}),
      ...(f.q
        ? {
            // Postgres matching is case-sensitive by default; "afro" should find "Afrobeats".
            OR: [
              { title: { contains: f.q, mode: "insensitive" } },
              { venue: { contains: f.q, mode: "insensitive" } },
              { description: { contains: f.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    include: { ticketTypes: { select: { priceKobo: true, quantity: true, sold: true } } },
    take: 60,
  });
}
