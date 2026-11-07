import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(300).optional(),
});

/** Admin approves (user becomes ORGANIZER) or rejects an application. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (admin?.role !== "ADMIN") return jsonError("Admins only", 403);
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
      ...(action === "APPROVE"
        ? [prisma.user.update({ where: { id: app.userId }, data: { role: "ORGANIZER" } })]
        : []),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
