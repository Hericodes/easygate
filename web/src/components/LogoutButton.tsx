"use client";

import { LogOutIcon } from "./icons";

export default function LogoutButton({ className = "btn-ghost" }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      <LogOutIcon className="h-4 w-4" /> Log out
    </button>
  );
}
