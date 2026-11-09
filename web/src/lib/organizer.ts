import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isAdmin, isOrganizer } from "./auth";
import { prisma } from "./db";

/** For organizer pages: redirects visitors who aren't signed-in organizers. */
export async function requireOrganizer() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/organizer");
  if (!isOrganizer(user)) redirect("/organizers/apply");
  return user;
}

/** Loads an event the current organizer owns (admins can see all), or 404s. */
export async function requireOwnEvent(eventId: string) {
  const user = await requireOrganizer();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { ticketTypes: true },
  });
  if (!event || (event.organizerId !== user.id && !isAdmin(user))) notFound();
  return { user, event };
}
