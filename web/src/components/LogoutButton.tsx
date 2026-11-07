"use client";

export default function LogoutButton({
  className = "rounded-lg px-3 py-2 text-zinc-500 hover:bg-zinc-100",
}: {
  className?: string;
}) {
  return (
    <button
      className={className}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Log out
    </button>
  );
}
