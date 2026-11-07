"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setMsg(null);
    if (f.newPassword !== f.confirm) return setMsg({ ok: false, text: "New passwords don't match" });
    setLoading(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: f.currentPassword, newPassword: f.newPassword }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: body.error });
    form.reset();
    setMsg({ ok: true, text: hasPassword ? "Password changed" : "Password set" });
    if (!hasPassword) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {hasPassword && (
        <div>
          <label className="label" htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className="input" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="newPassword">New password</label>
          <input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </div>
      </div>
      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}
      <button disabled={loading} className="btn-primary">{loading ? "Saving…" : hasPassword ? "Update password" : "Set password"}</button>
    </form>
  );
}
