import Link from "next/link";
import CategoryIcon from "./CategoryIcon";
import { CalendarIcon } from "./icons";
import { CATEGORIES } from "@/lib/format";

/**
 * Category shortcuts (All Events, Parties, Concerts, …). Each opens the Explore page filtered.
 * `active` highlights one; leave it out on the homepage.
 */
export default function CategoryNavigation({ active, q }: { active?: string; q?: string }) {
  const href = (category?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    const qs = p.toString();
    return `/events${qs ? `?${qs}` : ""}`;
  };

  const items = [
    { value: "ALL", label: "All Events", tile: "bg-brand-50 text-brand-600", href: href() },
    ...CATEGORIES.map((c) => ({ value: c.value as string, label: c.short as string, tile: c.tile as string, href: href(c.value) })),
  ];

  return (
    <nav aria-label="Event categories" className="rounded-[24px] bg-white p-2 shadow-[var(--shadow-card)] ring-1 ring-line">
      <ul className="no-scrollbar flex overflow-x-auto">
        {items.map((item, i) => {
          const isActive = active === item.value;
          return (
            <li key={item.value} className="flex shrink-0 items-center">
              {i > 0 && <span aria-hidden className="h-10 w-px bg-line" />}
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex w-[78px] flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center text-[12px] font-semibold transition-colors sm:w-[96px] sm:text-[13px] ${
                  isActive ? "text-brand-700" : "text-ink hover:text-brand-700"
                }`}
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl transition duration-200 group-hover:-translate-y-0.5 sm:h-14 sm:w-14 ${
                    isActive ? "primary-gradient text-white shadow-lg shadow-brand-600/30" : item.tile
                  }`}
                >
                  {item.value === "ALL" ? (
                    <CalendarIcon className="h-6 w-6" strokeWidth={2} />
                  ) : (
                    <CategoryIcon category={item.value} className="h-6 w-6" strokeWidth={2} />
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
