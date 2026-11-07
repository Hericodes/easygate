"use client";

import { useState } from "react";

export default function MockPayButtons({ reference }: { reference: string }) {
  const [loading, setLoading] = useState(false);
  async function pay(succeed: boolean) {
    setLoading(true);
    const res = await fetch("/api/payments/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, succeed }),
    });
    const body = await res.json();
    window.location.href = body.redirectUrl ?? "/tickets";
  }
  return (
    <div className="mt-6 grid gap-2">
      <button disabled={loading} onClick={() => pay(true)} className="btn-primary py-3">
        Simulate successful payment
      </button>
      <button disabled={loading} onClick={() => pay(false)} className="btn-ghost">
        Simulate failed payment
      </button>
    </div>
  );
}
