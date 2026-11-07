import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fulfillOrder } from "@/lib/tickets";
import { verifyTransaction } from "@/lib/paystack";

/** Paystack redirects the buyer here after checkout (?reference=...). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
  const back = (path: string) => NextResponse.redirect(new URL(path, url.origin));
  if (!reference) return back("/tickets?error=missing-reference");

  try {
    const order = await prisma.order.findUnique({ where: { reference } });
    if (!order) return back("/tickets?error=order-not-found");
    if (order.status === "PAID") return back(`/tickets?ref=${reference}`);

    const tx = await verifyTransaction(reference);
    if (tx.status !== "success") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return back("/tickets?error=payment-failed");
    }
    const ok = await fulfillOrder(reference, tx.amount);
    return back(ok ? `/tickets?ref=${reference}` : "/tickets?error=sold-out");
  } catch (err) {
    console.error(err);
    return back("/tickets?error=verify-failed");
  }
}
