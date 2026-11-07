import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      ticketTypes: true,
      organizer: { select: { name: true } },
    },
  });
  if (!event || !event.published) return jsonError("Event not found", 404);
  return NextResponse.json({ event });
}
