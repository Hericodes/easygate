import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (user && !user.passwordHash) {
      return jsonError("This account uses Google sign-in. Tap “Continue with Google”.", 401);
    }
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash!))) {
      return jsonError("Wrong email or password", 401);
    }
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
