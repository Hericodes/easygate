import Link from "next/link";

type Tab = "upcoming" | "past" | "history";

/** Segmented control for My Tickets: Upcoming · Past · Orders. */
export default function TicketTabs({ active, counts }: { active: Tab; counts?: { upcoming: number; past: number } }) {
  const tabs: [Tab, string, string, number | undefined][] = [
    ["upcoming", "/tickets", "Upcoming", counts?.upcoming],
    ["past", "/tickets?view=past", "Past", counts?.past],
    ["history", "/tickets/history", "Orders", undefined],
  ];
  return (
    <div className="inline-flex gap-1 rounded-full bg-white p-1 shadow-[var(--shadow-card)] ring-1 ring-line">
      {tabs.map(([key, href, label, count]) => {
        const on = key === active;
        return (
          <Link
            key={key}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
              on ? "primary-gradient text-white shadow-md shadow-brand-600/25" : "text-muted hover:text-ink"
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span
                className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold ${
                  on ? "bg-white/25 text-white" : "bg-brand-50 text-brand-700"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
