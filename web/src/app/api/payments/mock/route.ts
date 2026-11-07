import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";
import { fulfillOrder } from "@/lib/tickets";
import { paystackEnabled } from "@/lib/paystack";

/** Development-only stand-in for Paystack when no secret key is set. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" || paystackEnabled()) {
    return jsonError("Not available", 404);
  }
  try {
    const user = await getCurrentUser();
    const { reference, succeed } = z
      .object({ reference: z.string(), succeed: z.boolean() })
      .parse(await req.json());
    const order = await prisma.order.findUnique({ where: { reference } });
    if (!order || order.userId !== user?.id) return jsonError("Order not found", 404);

    if (!succeed) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return NextResponse.json({ redirectUrl: "/tickets?error=payment-failed" });
    }
    const ok = await fulfillOrder(reference, order.amountKobo);
    return NextResponse.json({
      redirectUrl: ok ? `/tickets?ref=${reference}` : "/tickets?error=sold-out",
    });
  } catch (err) {
    return handleError(err);
  }
}
