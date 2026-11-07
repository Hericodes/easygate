import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { getUserTickets } from "@/lib/user-tickets";

/** The signed-in user's tickets, each with a QR code data URL. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Log in first", 401);
  return NextResponse.json({ tickets: await getUserTickets(user.id) });
}
