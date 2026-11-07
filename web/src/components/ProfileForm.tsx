"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Profile = { name: string; email: string; phone: string };

export default function ProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: body.error });
    setMsg({ ok: true, text: "Profile saved" });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" name="name" required defaultValue={initial.name} className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required defaultValue={initial.email} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" defaultValue={initial.phone} placeholder="0803 123 4567" className="input" />
        </div>
      </div>
      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}
      <button disabled={loading} className="btn-primary">{loading ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
