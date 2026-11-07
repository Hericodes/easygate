import { NextResponse } from "next/server";
import { fulfillOrder } from "@/lib/tickets";
import { isValidWebhookSignature } from "@/lib/paystack";

/**
 * Paystack webhook. Set the URL in the Paystack dashboard to
 * {APP_URL}/api/payments/webhook. Catches payments where the buyer
 * closed the tab before being redirected back.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!isValidWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(raw);
  if (event.event === "charge.success") {
    try {
      await fulfillOrder(event.data.reference, event.data.amount);
    } catch (err) {
      console.error("Webhook fulfil failed", err);
    }
  }
  return NextResponse.json({ received: true });
}
