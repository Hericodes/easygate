import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { isAdmin, isOrganizer } from "@/lib/auth";
import Avatar from "./Avatar";
import Logo from "./Logo";
import NavLink from "./NavLink";
import { BellIcon } from "./icons";

/** Top bar: logo, desktop links, notifications bell and profile (or log in / sign up). */
export default function Header({ user, unread }: { user: SessionUser | null; unread: number }) {
  const organizer = isOrganizer(user);
  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-page/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-3 px-4">
        <Logo />

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          <NavLink href="/events" match={["/events"]}>Events</NavLink>
          {user && <NavLink href="/tickets">My tickets</NavLink>}
          {organizer ? (
            <NavLink href="/organizer">Dashboard</NavLink>
          ) : (
            <NavLink href="/organizers/apply">Host an event</NavLink>
          )}
          {isAdmin(user) && <NavLink href="/admin">Admin</NavLink>}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {user ? (
            <>
              <Link
                href="/notifications"
                aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
                className="relative grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-[0_6px_18px_-10px_rgb(59_7_100/0.35)] ring-1 ring-line transition hover:text-brand-600 active:scale-95"
              >
                <BellIcon className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-pink-500 ring-2 ring-white" />
                )}
              </Link>
              <Link
                href="/account"
                aria-label="Your profile"
                title="Your profile"
                className="rounded-full transition active:scale-95"
              >
                <Avatar name={user.name} src={user.avatarUrl} online />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink transition-colors hover:text-brand-600 sm:block"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
