import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin, isSuperAdmin } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";

const schema = z.object({ role: z.enum(["STUDENT", "ORGANIZER", "ADMIN"]) });

/**
 * Change someone's role.
 * - Admins can switch accounts between Student and Organizer.
 * - Only the super admin can make or remove admins.
 * - Nobody can change their own role, and the super admin can't be changed here.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getCurrentUser();
    if (!actor || !isAdmin(actor)) return jsonError("Admins only", 403);
    const { id } = await params;
    const { role } = schema.parse(await req.json());

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!target) return jsonError("Account not found", 404);
    if (target.id === actor.id) return jsonError("You can't change your own role", 400);
    if (target.role === "SUPER_ADMIN") return jsonError("The super admin's role can't be changed", 403);
    if ((role === "ADMIN" || target.role === "ADMIN") && !isSuperAdmin(actor)) {
      return jsonError("Only the super admin can add or remove admins", 403);
    }

    const user = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, role: true } });
    return NextResponse.json({ user });
  } catch (err) {
    return handleError(err);
  }
}
