"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const LABEL: Record<string, string> = { STUDENT: "Student", ORGANIZER: "Organizer", ADMIN: "Admin" };

/** Role picker for one account. Only shows the roles the signed-in admin is allowed to give. */
export default function UserRoleActions({ id, role, options }: { id: string; role: string; options: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (value === role) return;
    if (value === "ADMIN" && !confirm("Make this account an admin? Admins can review events, organizers and orders.")) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: value }),
    });
    setLoading(false);
    if (!res.ok) {
      setValue(role);
      return setError((await res.json()).error ?? "Couldn't update the role");
    }
    router.refresh();
  }

  return (
    <div className="flex w-full flex-col items-end gap-1 sm:w-auto">
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Role"
          className="input h-10 flex-1 py-0 sm:w-36 sm:flex-none"
          disabled={loading}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {LABEL[o]}
            </option>
          ))}
        </select>
        <button type="button" onClick={save} disabled={loading || value === role} className="btn-primary h-10 px-4 text-xs">
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
