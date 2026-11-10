import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin, isOrganizer } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";
import { listUpcomingEvents } from "@/lib/events";
import { CATEGORIES, slugify } from "@/lib/format";
import { CAMPUS } from "@/lib/campus";
import { ownsFlyer } from "@/lib/images";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const events = await listUpcomingEvents({
    q: sp.get("q") ?? undefined,
    campus: sp.get("campus") ?? undefined,
    category: sp.get("category") ?? undefined,
  });
  return NextResponse.json({ events });
}

const createSchema = z.object({
  title: z.string().trim().min(3, "Title is too short"),
  description: z.string().trim().min(10, "Add a short description"),
  category: z.enum(CATEGORIES.map((c) => c.value) as [string, ...string[]]),
  venue: z.string().trim().min(2, "Enter the venue"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  // A flyer uploaded first with POST /api/uploads.
  imageUrl: z.string().trim().max(200).optional().or(z.literal("")),
  ticketTypes: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Name each ticket type"),
        priceNaira: z.coerce.number().min(0, "Price can't be negative"),
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
      }),
    )
    .min(1, "Add at least one ticket type"),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Log in first", 401);
    if (!isOrganizer(user)) return jsonError("Only approved organizers can create events. Apply at /organizers/apply", 403);

    const data = createSchema.parse(await req.json());
    if (data.startsAt < new Date()) return jsonError("Event must start in the future");
    if (data.endsAt && data.endsAt <= data.startsAt) return jsonError("The event must end after it starts");
    if (data.imageUrl && !(await ownsFlyer(user.id, data.imageUrl))) {
      return jsonError("Upload the flyer again, then submit");
    }

    const event = await prisma.event.create({
      data: {
        slug: slugify(data.title),
        title: data.title,
        description: data.description,
        category: data.category,
        campus: CAMPUS,
        venue: data.venue,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        imageUrl: data.imageUrl || null,
        organizerId: user.id,
        status: isAdmin(user) ? "APPROVED" : "PENDING",
        reviewedAt: isAdmin(user) ? new Date() : null,
        ticketTypes: {
          create: data.ticketTypes.map((t) => ({
            name: t.name,
            priceKobo: Math.round(t.priceNaira * 100),
            quantity: t.quantity,
          })),
        },
      },
    });
    return NextResponse.json({ event });
  } catch (err) {
    return handleError(err);
  }
}
