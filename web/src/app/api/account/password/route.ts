import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";

const schema = z.object({
  // Optional only for Google accounts that don't have a password yet.
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Log in first", 401);
    const { currentPassword, newPassword } = schema.parse(await req.json());

    const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (record.passwordHash && !(await bcrypt.compare(currentPassword ?? "", record.passwordHash))) {
      return jsonError("Current password is wrong", 400);
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
