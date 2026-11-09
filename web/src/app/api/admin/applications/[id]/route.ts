import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(300).optional(),
});

/** Admin approves (user becomes ORGANIZER) or rejects an application. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!isAdmin(admin)) return jsonError("Admins only", 403);
    const { id } = await params;
    const { action, note } = schema.parse(await req.json());

    const app = await prisma.organizerApplication.findUnique({ where: { id } });
    if (!app) return jsonError("Application not found", 404);
    if (app.status !== "PENDING") return jsonError("Already reviewed", 409);

    await prisma.$transaction([
      prisma.organizerApplication.update({
        where: { id },
        data: {
          status: action === "APPROVE" ? "APPROVED" : "REJECTED",
          reviewNote: note || null,
          reviewedAt: new Date(),
        },
      }),
      // Only students are upgraded. Someone who is already an organizer, admin or super admin
      // keeps their role, so approving an old application can never demote anyone.
      ...(action === "APPROVE"
        ? [prisma.user.updateMany({ where: { id: app.userId, role: "STUDENT" }, data: { role: "ORGANIZER" } })]
        : []),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
