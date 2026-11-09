import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(300).optional(),
});

/** Admin approves an event (it goes live) or rejects / takes it down (hidden from students). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!isAdmin(admin)) return jsonError("Admins only", 403);
    const { id } = await params;
    const { action, note } = schema.parse(await req.json());

    const event = await prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!event) return jsonError("Event not found", 404);

    await prisma.event.update({
      where: { id },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewNote: action === "REJECT" ? note || null : null,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
