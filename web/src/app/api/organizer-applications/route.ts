import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isOrganizer } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";

const schema = z.object({
  orgName: z.string().trim().min(2, "Enter your club, association or brand name"),
  phone: z.string().trim().regex(/^\+?[0-9 ]{10,15}$/, "Enter a valid phone number"),
  eventTypes: z.string().trim().min(3, "Tell us what events you plan to host"),
  socialHandle: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1000).optional(),
});

/** The current user's latest application, if any. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Log in first", 401);
  const application = await prisma.organizerApplication.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ application });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Log in first", 401);
    if (isOrganizer(user)) return jsonError("You're already an organizer");

    const pending = await prisma.organizerApplication.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });
    if (pending) return jsonError("Your application is already being reviewed", 409);

    const data = schema.parse(await req.json());
    const application = await prisma.organizerApplication.create({
      data: {
        ...data,
        socialHandle: data.socialHandle || null,
        message: data.message || null,
        userId: user.id,
      },
    });
    return NextResponse.json({ application });
  } catch (err) {
    return handleError(err);
  }
}
