import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";
import { CAMPUS } from "@/lib/campus";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return jsonError("An account with this email already exists", 409);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        // Everyone starts as a student; organizer access is granted by an admin.
        campus: CAMPUS,
        role: "STUDENT",
        passwordHash: await bcrypt.hash(data.password, 10),
      },
    });
    const token = await createToken(user.id);
    await setSessionCookie(token);
    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return handleError(err);
  }
}
