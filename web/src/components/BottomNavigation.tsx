"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "./NavLink";
import {
  CompassIcon,
  DashboardIcon,
  HomeIcon,
  QrIcon,
  ScanQrIcon,
  TicketIcon,
  UserIcon,
  type IconProps,
} from "./icons";

type Item = { href: string; label: string; Icon: (p: IconProps) => React.ReactElement; match: string[] };

/**
 * Phone tab bar with a raised centre button. For organizers the centre button opens the
 * ticket scanner; for everyone else it shows their next ticket's QR code.
 * Hidden from the `sm` breakpoint up (the header has the links there).
 */
export default function BottomNavigation({ loggedIn, organizer }: { loggedIn: boolean; organizer: boolean }) {
  const pathname = usePathname();

  const left: Item[] = [
    { href: "/", label: "Home", Icon: HomeIcon, match: ["/"] },
    { href: "/tickets", label: "My Tickets", Icon: TicketIcon, match: ["/tickets"] },
  ];
  const right: Item[] = [
    organizer
      ? { href: "/organizer", label: "Dashboard", Icon: DashboardIcon, match: ["/organizer"] }
      : { href: "/events", label: "Explore", Icon: CompassIcon, match: ["/events"] },
    loggedIn
      ? { href: "/account", label: "Profile", Icon: UserIcon, match: ["/account", "/notifications"] }
      : { href: "/login", label: "Log in", Icon: UserIcon, match: ["/login", "/signup"] },
  ];
  const center = organizer
    ? { href: "/organizer/scan", label: "Scan tickets", Icon: ScanQrIcon }
    : { href: loggedIn ? "/tickets/next" : "/login?next=/tickets", label: "Show my ticket", Icon: QrIcon };

  const tab = (item: Item) => {
    const active = isActivePath(pathname, item.match);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
            active ? "text-brand-600" : "text-muted"
          }`}
        >
          <item.Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.3 : 1.9} />
          {item.label}
          <span
            aria-hidden
            className={`absolute bottom-1.5 h-1 w-6 rounded-full bg-brand-600 transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
          />
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 sm:hidden">
      <div className="relative mx-auto max-w-lg">
        <Link
          href={center.href}
          aria-label={center.label}
          className="primary-gradient absolute left-1/2 top-0 z-10 grid h-[60px] w-[60px] -translate-x-1/2 -translate-y-[40%] place-items-center rounded-full text-white shadow-[0_12px_26px_-8px_rgb(100_21_245/0.75)] ring-[6px] ring-page transition active:scale-95"
        >
          <center.Icon className="h-7 w-7" strokeWidth={2.1} />
        </Link>
        <ul
          className="grid grid-cols-5 rounded-t-[26px] border-t border-line bg-white/95 px-1 shadow-[0_-12px_30px_-16px_rgb(59_7_100/0.3)] backdrop-blur-xl"
          style={{ height: "calc(4rem + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {left.map(tab)}
          <li aria-hidden />
          {right.map(tab)}
        </ul>
      </div>
    </nav>
  );
}
