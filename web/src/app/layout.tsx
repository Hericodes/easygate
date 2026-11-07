import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser, isOrganizer } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import MobileNav from "@/components/MobileNav";
import NavLink from "@/components/NavLink";
import { TicketIcon } from "@/components/icons";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EasyGate: OOU events and tickets",
  description: "Discover parties, concerts and programs at Olabisi Onabanjo University and get your ticket in seconds.",
  applicationName: "EasyGate",
  appleWebApp: { capable: true, title: "EasyGate", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const organizer = isOrganizer(user);

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} ${display.variable} font-sans antialiased`}>
        <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl">
          <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
            <Link href="/" aria-label="EasyGate home" className="group flex items-center gap-2.5">
              <span className="brand-gradient grid h-9 w-9 place-items-center rounded-xl text-white shadow-lg shadow-brand-500/30 transition duration-300 group-hover:-rotate-12 group-hover:scale-110">
                <TicketIcon className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight">
                Easy<span className="gradient-text">Gate</span>
              </span>
            </Link>

            <div className="ml-auto hidden items-center gap-1 sm:flex">
              <NavLink href="/" match={["/", "/events"]}>Events</NavLink>
              {user && <NavLink href="/tickets">My tickets</NavLink>}
              {organizer ? (
                <NavLink href="/organizer">Dashboard</NavLink>
              ) : (
                <NavLink href="/organizers/apply">Host an event</NavLink>
              )}
              {user?.role === "ADMIN" && <NavLink href="/admin/applications">Applications</NavLink>}
            </div>

            <div className="ml-auto flex items-center gap-2 sm:ml-3">
              {user ? (
                <Link
                  href="/account"
                  title="Account"
                  aria-label="Account"
                  className="rounded-full transition duration-200 hover:scale-110"
                >
                  <Avatar name={user.name} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-ink sm:block"
                  >
                    Log in
                  </Link>
                  <Link href="/signup" className="btn-primary">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="mx-auto max-w-6xl px-4 pb-28 pt-6 text-sm text-zinc-500 sm:pb-10">
          <div className="flex flex-col gap-3 border-t border-zinc-200/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} <span className="font-display font-bold text-ink">EasyGate</span> · OOU
              events, sorted.
            </p>
            <div className="flex gap-5">
              <Link href="/" className="py-2 transition-colors hover:text-brand-700">Browse events</Link>
              <Link href="/organizers/apply" className="py-2 transition-colors hover:text-brand-700">Become an organizer</Link>
            </div>
          </div>
        </footer>

        <MobileNav loggedIn={Boolean(user)} organizer={organizer} admin={user?.role === "ADMIN"} />
      </body>
    </html>
  );
}
