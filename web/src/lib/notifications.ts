import { prisma } from "./db";
import { isAdmin, isOrganizer, type SessionUser } from "./auth";
import { dateParts, soonLabel } from "./format";

/** Cookie holding when the user last opened the notifications page (ms timestamp). */
export const SEEN_COOKIE = "eg_notif_seen";

export type NoticeKind = "reminder" | "payment" | "organizer" | "admin" | "sales";

export type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  href: string;
  at: Date;
};

const MINUTE = 60e3;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Notifications are worked out from real data each time (nothing is stored):
 * upcoming events you hold tickets for, unfinished payments, your organizer
 * application, recent sales (organizers) and applications to review (admins).
 */
export async function getNotifications(user: SessionUser): Promise<Notice[]> {
  const now = Date.now();
  const organizer = isOrganizer(user);

  const admin = isAdmin(user);
  const [tickets, pending, application, waiting, sales, eventsToReview, reviewedEvents] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        userId: user.id,
        checkedInAt: null,
        event: { startsAt: { gte: new Date(now - 6 * HOUR), lte: new Date(now + 7 * DAY) } },
      },
      select: {
        code: true,
        createdAt: true,
        eventId: true,
        event: { select: { title: true, startsAt: true, venue: true } },
      },
      orderBy: { event: { startsAt: "asc" } },
    }),
    prisma.order.findMany({
      where: { userId: user.id, status: "PENDING", createdAt: { gte: new Date(now - DAY), lte: new Date(now - 15 * MINUTE) } },
      select: { id: true, createdAt: true, event: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.organizerApplication.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    admin
      ? prisma.organizerApplication.findMany({
          where: { status: "PENDING" },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    organizer
      ? prisma.ticket.findMany({
          where: { event: { organizerId: user.id }, createdAt: { gte: new Date(now - DAY) } },
          select: { createdAt: true, eventId: true, event: { select: { title: true } } },
        })
      : Promise.resolve([]),
    admin
      ? prisma.event.findMany({ where: { status: "PENDING" }, select: { createdAt: true }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    organizer && !admin
      ? prisma.event.findMany({
          where: { organizerId: user.id, status: { in: ["APPROVED", "REJECTED"] }, reviewedAt: { gte: new Date(now - 14 * DAY) } },
          select: { id: true, title: true, status: true, reviewNote: true, reviewedAt: true },
        })
      : Promise.resolve([]),
  ]);

  const notes: Notice[] = [];

  // One reminder per upcoming event you hold a ticket for.
  const reminded = new Set<string>();
  for (const t of tickets) {
    if (reminded.has(t.eventId)) continue;
    reminded.add(t.eventId);
    const start = t.event.startsAt.getTime();
    const d = dateParts(t.event.startsAt);
    const when = start <= now ? "is happening now" : `is ${(soonLabel(t.event.startsAt) ?? `on ${d.weekday}`).toLowerCase()}`;
    notes.push({
      id: `reminder-${t.eventId}`,
      kind: "reminder",
      title: `${t.event.title} ${when}`,
      body: `${d.weekday}, ${d.day} ${d.month} at ${d.time} · ${t.event.venue}. Your QR ticket is ready.`,
      href: `/tickets/${t.code}`,
      at: new Date(Math.min(now, Math.max(t.createdAt.getTime(), start - 2 * DAY))),
    });
  }

  for (const o of pending) {
    notes.push({
      id: `payment-${o.id}`,
      kind: "payment",
      title: "Payment not completed",
      body: `Your order for ${o.event.title} wasn't paid, so no ticket was issued. You can try again.`,
      href: `/events/${o.event.slug}`,
      at: o.createdAt,
    });
  }

  if (application && !(organizer && application.status === "PENDING")) {
    const reviewedAt = application.reviewedAt ?? application.createdAt;
    if (application.status === "PENDING") {
      notes.push({
        id: `application-${application.id}`,
        kind: "organizer",
        title: "Organizer application under review",
        body: `We're reviewing your application for ${application.orgName}. We'll contact you on ${application.phone}.`,
        href: "/organizers/apply",
        at: application.createdAt,
      });
    } else if (application.status === "APPROVED") {
      if (!admin) {
        notes.push({
          id: `application-${application.id}`,
          kind: "organizer",
          title: "You're now a verified organizer",
          body: "Create your first event and start selling tickets.",
          href: "/organizer/events/new",
          at: reviewedAt,
        });
      }
    } else {
      notes.push({
        id: `application-${application.id}`,
        kind: "organizer",
        title: "Organizer application not approved",
        body: application.reviewNote ? `Reason: ${application.reviewNote}` : "You can update your details and apply again.",
        href: "/organizers/apply",
        at: reviewedAt,
      });
    }
  }

  if (waiting.length) {
    notes.push({
      id: "admin-applications",
      kind: "admin",
      title: `${waiting.length} organizer application${waiting.length === 1 ? "" : "s"} waiting`,
      body: "Review them so new organizers can start selling tickets.",
      href: "/admin/applications",
      at: waiting[0].createdAt,
    });
  }

  const byEvent = new Map<string, { title: string; count: number; last: number }>();
  for (const s of sales) {
    const entry = byEvent.get(s.eventId) ?? { title: s.event.title, count: 0, last: 0 };
    entry.count += 1;
    entry.last = Math.max(entry.last, s.createdAt.getTime());
    byEvent.set(s.eventId, entry);
  }
  for (const [eventId, e] of byEvent) {
    notes.push({
      id: `sales-${eventId}`,
      kind: "sales",
      title: `${e.count} ticket${e.count === 1 ? "" : "s"} sold for ${e.title}`,
      body: "In the last 24 hours. See who's coming in your dashboard.",
      href: `/organizer/events/${eventId}`,
      at: new Date(e.last),
    });
  }

  if (eventsToReview.length) {
    notes.push({
      id: "admin-events",
      kind: "admin",
      title: `${eventsToReview.length} event${eventsToReview.length === 1 ? "" : "s"} waiting for review`,
      body: "Check them before they go live to students.",
      href: "/admin/events",
      at: eventsToReview[0].createdAt,
    });
  }

  for (const e of reviewedEvents) {
    const approved = e.status === "APPROVED";
    notes.push({
      id: `event-review-${e.id}`,
      kind: "organizer",
      title: approved ? `${e.title} is live` : `${e.title} wasn't approved`,
      body: approved
        ? "Students can now see your event and buy tickets. Share the link!"
        : e.reviewNote
          ? `Reason: ${e.reviewNote}`
          : "Contact the EasyGate team for details.",
      href: `/organizer/events/${e.id}`,
      at: e.reviewedAt ?? new Date(now),
    });
  }

  return notes.sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** How many notifications are newer than the last visit to the notifications page. */
export async function countUnread(user: SessionUser, seenAt: number) {
  try {
    const notes = await getNotifications(user);
    return notes.filter((n) => n.at.getTime() > seenAt).length;
  } catch {
    return 0; // never let the bell break a page
  }
}
