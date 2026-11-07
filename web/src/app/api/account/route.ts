import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9 ]{10,15})?$/, "Enter a valid phone number")
    .optional(),
});

/** Update the signed-in user's profile. */
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Log in first", 401);
    const data = schema.parse(await req.json());

    if (data.email !== user.email) {
      const taken = await prisma.user.findUnique({ where: { email: data.email } });
      if (taken) return jsonError("That email is already used by another account", 409);
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: data.name, email: data.email, phone: data.phone || null },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    return NextResponse.json({ user: updated });
  } catch (err) {
    return handleError(err);
  }
}
