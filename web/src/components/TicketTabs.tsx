import Link from "next/link";

export default function TicketTabs({ active }: { active: "tickets" | "history" }) {
  const tab = (key: string, href: string, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition duration-200 ${
        active === key
          ? "brand-gradient text-white shadow-md shadow-brand-500/25"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="inline-flex gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-zinc-200/70">
      {tab("tickets", "/tickets", "My tickets")}
      {tab("history", "/tickets/history", "History")}
    </div>
  );
}
