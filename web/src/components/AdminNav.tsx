"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Tabs across the admin area, with counts of what's waiting for review. */
export default function AdminNav({ pendingEvents, pendingApplications }: { pendingEvents: number; pendingApplications: number }) {
  const pathname = usePathname();
  const tabs: [string, string, number][] = [
    ["/admin", "Overview", 0],
    ["/admin/events", "Events", pendingEvents],
    ["/admin/applications", "Organizers", pendingApplications],
    ["/admin/users", "Users", 0],
    ["/admin/orders", "Orders", 0],
  ];
  return (
    <nav aria-label="Admin" className="no-scrollbar -mx-4 overflow-x-auto px-4">
      <ul className="inline-flex gap-1 rounded-full bg-white p-1 shadow-[var(--shadow-card)] ring-1 ring-line">
        {tabs.map(([href, label, count]) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active ? "primary-gradient text-white shadow-md shadow-brand-600/25" : "text-muted hover:text-ink"
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold ${
                      active ? "bg-white/25 text-white" : "bg-pink-500 text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
