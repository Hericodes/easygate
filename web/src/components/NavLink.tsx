"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function isActivePath(pathname: string, prefixes: string[]) {
  return prefixes.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"),
  );
}

/** Header link with an animated gradient underline (shown on hover and when active). */
export default function NavLink({
  href,
  match,
  children,
}: {
  href: string;
  match?: string[];
  children: React.ReactNode;
}) {
  const active = isActivePath(usePathname(), match ?? [href]);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
        active ? "text-brand-700" : "text-zinc-600 hover:text-ink"
      }`}
    >
      {children}
      <span
        aria-hidden
        className={`brand-gradient absolute inset-x-3 bottom-0.5 h-0.5 origin-left rounded-full transition-transform duration-300 ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}
