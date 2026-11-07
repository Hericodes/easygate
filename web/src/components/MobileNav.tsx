"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "./NavLink";
import {
  CompassIcon,
  DashboardIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketIcon,
  UserIcon,
} from "./icons";

type Item = {
  href: string;
  label: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  match?: string[];
};

/** App-style tab bar on phones. Hidden from the `sm` breakpoint up (the header has the links). */
export default function MobileNav({
  loggedIn,
  organizer,
  admin,
}: {
  loggedIn: boolean;
  organizer: boolean;
  admin: boolean;
}) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/", label: "Explore", Icon: CompassIcon, match: ["/", "/events"] },
    loggedIn
      ? { href: "/tickets", label: "Tickets", Icon: TicketIcon }
      : { href: "/organizers/apply", label: "Host", Icon: SparklesIcon },
    ...(organizer ? [{ href: "/organizer", label: "Dashboard", Icon: DashboardIcon }] : []),
    ...(admin ? [{ href: "/admin/applications", label: "Review", Icon: ShieldCheckIcon }] : []),
    loggedIn
      ? { href: "/account", label: "Account", Icon: UserIcon }
      : { href: "/login", label: "Log in", Icon: UserIcon, match: ["/login", "/signup"] },
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/70 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {items.map((item) => {
          const active = isActivePath(pathname, item.match ?? [item.href]);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex min-w-16 flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold"
              >
                <span
                  className={`grid h-8 w-14 place-items-center rounded-full transition-all duration-300 ${
                    active ? "brand-gradient text-white shadow-md shadow-brand-500/30" : "text-zinc-500"
                  }`}
                >
                  <item.Icon className="h-5 w-5" />
                </span>
                <span className={`transition-colors ${active ? "text-brand-700" : "text-zinc-500"}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
