"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReviewButtons({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function review(action: "APPROVE" | "REJECT") {
    let note: string | undefined;
    if (action === "REJECT") {
      const input = prompt("Reason (shown to the applicant, optional):");
      if (input === null) return;
      note = input;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    setLoading(false);
    if (!res.ok) alert((await res.json()).error);
    router.refresh();
  }

  return (
    <div className="flex items-start gap-2">
      <button disabled={loading} onClick={() => review("REJECT")} className="btn-ghost">Reject</button>
      <button disabled={loading} onClick={() => review("APPROVE")} className="btn-primary">Approve</button>
    </div>
  );
}
