import crypto from "crypto";

const BASE = "https://api.paystack.co";

export const paystackEnabled = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok || !body.status) throw new Error(body.message ?? "Paystack request failed");
  return body.data as T;
}

export function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export function verifyTransaction(reference: string) {
  return call<{ status: string; amount: number; reference: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

/** Paystack signs webhook bodies with HMAC-SHA512 of the secret key. */
export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
