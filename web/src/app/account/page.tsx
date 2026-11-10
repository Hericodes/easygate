import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin, isOrganizer, ROLE_LABEL } from "@/lib/auth";
import { countUnread, SEEN_COOKIE } from "@/lib/notifications";
import { dateParts, naira, soonLabel } from "@/lib/format";
import AvatarUpload from "@/components/AvatarUpload";
import EventCover from "@/components/EventCover";
import LogoutButton from "@/components/LogoutButton";
import PasswordForm from "@/components/PasswordForm";
import ProfileForm from "@/components/ProfileForm";
import { LogoMark } from "@/components/Logo";
import {
  BadgeCheckIcon,
  BellIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClockIcon,
  CompassIcon,
  DashboardIcon,
  KeyIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  QrIcon,
  ReceiptIcon,
  ScanIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketIcon,
  UserIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/account");
  const seenAt = Number((await cookies()).get(SEEN_COOKIE)?.value) || 0;
  const organizer = isOrganizer(session);
  const admin = isAdmin(session);

  // A ticket is "upcoming" until its event ends (events without an end time count as 6 hours long).
  const now = new Date();
  const upcoming = {
    userId: session.id,
    checkedInAt: null,
    event: { OR: [{ endsAt: { gt: now } }, { endsAt: null, startsAt: { gt: new Date(now.getTime() - 6 * 3600e3) } }] },
  };

  const [user, paid, upcomingCount, attended, nextTicket, hosted, application, unread] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.id },
      select: {
        name: true,
        email: true,
        phone: true,
        role: true,
        campus: true,
        avatarUrl: true,
        createdAt: true,
        passwordHash: true,
        googleId: true,
      },
    }),
    prisma.order.aggregate({ where: { userId: session.id, status: "PAID" }, _sum: { amountKobo: true, quantity: true } }),
    prisma.ticket.count({ where: upcoming }),
    prisma.ticket.findMany({
      where: { userId: session.id, checkedInAt: { not: null } },
      distinct: ["eventId"],
      select: { eventId: true },
    }),
    prisma.ticket.findFirst({
      where: upcoming,
      orderBy: { event: { startsAt: "asc" } },
      select: {
        code: true,
        ticketType: { select: { name: true } },
        event: { select: { title: true, venue: true, startsAt: true, category: true, imageUrl: true } },
      },
    }),
    organizer ? prisma.event.count({ where: { organizerId: session.id } }) : Promise.resolve(0),
    organizer
      ? Promise.resolve(null)
      : prisma.organizerApplication.findFirst({
          where: { userId: session.id },
          orderBy: { createdAt: "desc" },
          select: { status: true },
        }),
    countUnread(session, seenAt),
  ]);

  const joined = new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(user.createdAt);
  const spent = paid._sum.amountKobo ?? 0;
  const RoleIcon = admin ? ShieldCheckIcon : organizer ? SparklesIcon : UserIcon;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Profile header */}
      <section className="card animate-fade-up overflow-visible">
        <div aria-hidden className="hero-surface relative h-36 overflow-hidden rounded-t-[1.5rem] sm:h-48">
          <div className="dot-pattern absolute inset-0 opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-pink-500/30 blur-3xl" />
          <div className="absolute -left-12 bottom-[-40%] h-56 w-56 rounded-full bg-purple-400/30 blur-3xl" />
          {/* Stage light beams */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "conic-gradient(from 200deg at 78% -10%, transparent 0deg, rgb(255 255 255 / 0.28) 6deg, transparent 13deg), conic-gradient(from 165deg at 92% -10%, transparent 0deg, rgb(255 255 255 / 0.2) 5deg, transparent 11deg)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute left-5 top-4 flex items-center gap-2 sm:left-8 sm:top-6">
            <LogoMark size="sm" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">EasyGate member</span>
          </div>
        </div>

        <div className="px-5 pb-5 sm:px-8 sm:pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="-mt-16 sm:-mt-20">
              <AvatarUpload name={user.name} src={user.avatarUrl} />
            </div>
            <div className="min-w-0 flex-1 sm:pb-2">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-[1.9rem]">{user.name}</h1>
                {organizer && (
                  <BadgeCheckIcon className="h-6 w-6 shrink-0 text-brand-600" strokeWidth={2.2} />
                )}
              </div>
              <p className="mt-0.5 truncate text-sm text-muted">{user.email}</p>
            </div>
            <div className="flex gap-2 sm:pb-2">
              <a href="#profile" className="btn-ghost h-10 flex-1 px-4 text-sm sm:flex-none">
                <PencilIcon className="h-4 w-4" /> Edit profile
              </a>
              <Link href="/tickets" className="btn-primary h-10 flex-1 px-4 text-sm sm:flex-none">
                <TicketIcon className="h-4 w-4" /> My tickets
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-brand-700 ring-1 ring-brand-100">
              <RoleIcon className="h-3.5 w-3.5" /> {ROLE_LABEL[user.role] ?? user.role}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1.5 text-muted ring-1 ring-line">
              <MapPinIcon className="h-3.5 w-3.5" /> {user.campus ?? "OOU"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1.5 text-muted ring-1 ring-line">
              <CalendarIcon className="h-3.5 w-3.5" /> Joined {joined}
            </span>
          </div>
        </div>

        {/* Stats */}
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-[1.5rem] border-t border-line bg-line sm:grid-cols-4">
          <Stat label="Tickets bought" value={(paid._sum.quantity ?? 0).toLocaleString()} />
          <Stat label="Upcoming" value={upcomingCount.toLocaleString()} />
          <Stat label="Events attended" value={attended.length.toLocaleString()} />
          <Stat label="Total spent" value={spent ? naira(spent) : "₦0"} />
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* Next event */}
        <div className="lg:col-start-1">
          <NextEvent ticket={nextTicket} />
        </div>

        {/* Side column (between the next event and the forms on phones) */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {organizer ? (
            <OrganizerCard hosted={hosted} />
          ) : application?.status === "PENDING" ? (
            <div className="card animate-fade-up flex gap-3.5 p-5" style={{ animationDelay: "60ms" }}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                <ClockIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-ink">Organizer application in review</p>
                <p className="mt-0.5 text-sm text-muted">An admin will look at it soon. We&apos;ll let you know in your notifications.</p>
              </div>
            </div>
          ) : (
            <BecomeOrganizerCard />
          )}

          <nav aria-label="Account" className="card animate-fade-up divide-y divide-line overflow-hidden" style={{ animationDelay: "100ms" }}>
            <MenuLink href="/tickets" icon={<TicketIcon className="h-5 w-5" />} title="My tickets" sub={upcomingCount === 1 ? "1 upcoming" : `${upcomingCount} upcoming`} />
            <MenuLink href="/tickets/history" icon={<ReceiptIcon className="h-5 w-5" />} title="Order history" sub="Payments and receipts" />
            <MenuLink
              href="/notifications"
              icon={<BellIcon className="h-5 w-5" />}
              title="Notifications"
              sub={unread ? `${unread} new` : "You're all caught up"}
              badge={unread}
            />
            {admin && (
              <MenuLink href="/admin" icon={<ShieldCheckIcon className="h-5 w-5" />} title="Admin panel" sub="Reviews, users and orders" />
            )}
          </nav>

          <LogoutButton className="btn-ghost hidden w-full py-3.5 text-red-600 lg:flex" />
        </aside>

        {/* Forms */}
        <div className="space-y-5 lg:col-start-1">
          <section id="profile" className="card animate-fade-up scroll-mt-24 p-5 sm:p-7" style={{ animationDelay: "140ms" }}>
            <SectionTitle
              icon={<UserIcon className="h-5 w-5" />}
              title="Personal information"
              sub="Organizers see your name and email on their guest list when you buy a ticket."
            />
            <ProfileForm initial={{ name: user.name, email: user.email, phone: user.phone ?? "" }} />
          </section>

          <section id="settings" className="card animate-fade-up scroll-mt-24 p-5 sm:p-7" style={{ animationDelay: "180ms" }}>
            <SectionTitle icon={<LockIcon className="h-5 w-5" />} title="Sign-in & security" sub="How you log in to EasyGate." />

            <ul className="mb-6 divide-y divide-line rounded-2xl ring-1 ring-line">
              <SignInMethod
                icon={<MailIcon className="h-5 w-5" />}
                title="Email and password"
                sub={user.passwordHash ? user.email : "No password yet"}
                on={Boolean(user.passwordHash)}
                onLabel="On"
                offLabel="Not set"
              />
              <SignInMethod
                icon={<GoogleMark />}
                title="Google"
                sub={user.googleId ? "Continue with Google works for this account" : "Log in with Google using this email to link it"}
                on={Boolean(user.googleId)}
                onLabel="Connected"
                offLabel="Not linked"
              />
            </ul>

            <h3 className="flex items-center gap-2 font-bold text-ink">
              <KeyIcon className="h-4 w-4 text-brand-600" /> {user.passwordHash ? "Change password" : "Set a password"}
            </h3>
            <p className="mb-4 mt-0.5 text-sm text-muted">
              {user.passwordHash ? "Use at least 8 characters." : "Add a password to also log in with your email. Use at least 8 characters."}
            </p>
            <PasswordForm hasPassword={Boolean(user.passwordHash)} />
          </section>

          <LogoutButton className="btn-ghost w-full py-3.5 text-red-600 lg:hidden" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-5 py-4 sm:px-8 sm:py-5">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 truncate text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{value}</dd>
    </div>
  );
}

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
      <div>
        <h2 className="text-lg font-extrabold leading-tight text-ink">{title}</h2>
        <p className="mt-0.5 text-sm text-muted">{sub}</p>
      </div>
    </div>
  );
}

type NextTicket = {
  code: string;
  ticketType: { name: string };
  event: { title: string; venue: string; startsAt: Date; category: string; imageUrl: string | null };
} | null;

function NextEvent({ ticket }: { ticket: NextTicket }) {
  if (!ticket) {
    return (
      <section className="card animate-fade-up flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6" style={{ animationDelay: "40ms" }}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <TicketIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">No upcoming events</p>
          <p className="mt-0.5 text-sm text-muted">Tickets you buy show up here, ready to scan at the gate.</p>
        </div>
        <Link href="/events" className="btn-soft h-10 px-4 text-sm">
          <CompassIcon className="h-4 w-4" /> Find events
        </Link>
      </section>
    );
  }
  const d = dateParts(ticket.event.startsAt);
  const soon = soonLabel(ticket.event.startsAt);
  return (
    <section className="card animate-fade-up overflow-hidden" style={{ animationDelay: "40ms" }}>
      <div className="flex items-center justify-between px-5 pt-4 sm:px-6">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted">Your next event</h2>
        <Link href="/tickets" className="text-sm font-bold text-brand-600 hover:text-brand-800">
          All tickets
        </Link>
      </div>
      <Link href={`/tickets/${ticket.code}`} className="group flex gap-4 p-4 sm:gap-5 sm:p-6">
        <div className="relative h-32 w-[6.5rem] shrink-0 overflow-hidden rounded-2xl shadow-md sm:h-36 sm:w-28">
          <EventCover title={ticket.event.title} category={ticket.event.category} imageUrl={ticket.event.imageUrl} size="sm" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap gap-1.5">
            {soon && (
              <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-[11px] font-bold text-pink-600">{soon}</span>
            )}
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">{ticket.ticketType.name}</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-lg font-extrabold leading-snug text-ink group-hover:text-brand-700">
            {ticket.event.title}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <CalendarIcon className="h-4 w-4 shrink-0" /> {d.weekday}, {d.day} {d.month} • {d.time}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <MapPinIcon className="h-4 w-4 shrink-0" /> <span className="truncate">{ticket.event.venue}</span>
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-bold text-brand-600">
            <QrIcon className="h-4 w-4" /> Show ticket
            <ChevronRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={2.4} />
          </span>
        </div>
      </Link>
    </section>
  );
}

function OrganizerCard({ hosted }: { hosted: number }) {
  return (
    <section className="hero-surface animate-fade-up relative isolate overflow-hidden rounded-[1.5rem] p-5 text-white shadow-[0_24px_50px_-24px_rgb(59_7_100/0.7)]" style={{ animationDelay: "60ms" }}>
      <div aria-hidden className="absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-pink-500/30 blur-3xl" />
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-200">
        <BadgeCheckIcon className="h-4 w-4" /> Verified organizer
      </p>
      <p className="mt-3 text-3xl font-extrabold">{hosted.toLocaleString()}</p>
      <p className="text-sm text-white/70">{hosted === 1 ? "event created" : "events created"}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/organizer" className="btn-white h-10 px-3 text-sm">
          <DashboardIcon className="h-4 w-4" /> Dashboard
        </Link>
        <Link href="/organizer/events/new" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/15 px-3 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/25">
          <PlusIcon className="h-4 w-4" /> New event
        </Link>
      </div>
      <Link href="/organizer/scan" className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold text-white/80 transition hover:text-white">
        <ScanIcon className="h-4 w-4" /> Scan tickets at the gate
      </Link>
    </section>
  );
}

function BecomeOrganizerCard() {
  return (
    <section className="hero-surface animate-fade-up relative isolate overflow-hidden rounded-[1.5rem] p-5 text-white" style={{ animationDelay: "60ms" }}>
      <div aria-hidden className="absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-pink-500/30 blur-3xl" />
      <SparklesIcon className="h-6 w-6 text-brand-200" />
      <p className="mt-3 text-lg font-extrabold leading-snug">Hosting an event at OOU?</p>
      <p className="mt-1 text-sm text-white/70">Apply to become an organizer and sell tickets on EasyGate.</p>
      <Link href="/organizers/apply" className="btn-white mt-4 h-10 w-full text-sm">
        Become an organizer
      </Link>
    </section>
  );
}

function SignInMethod({
  icon,
  title,
  sub,
  on,
  onLabel,
  offLabel,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  on: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <li className="flex items-center gap-3.5 px-4 py-3.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-page text-ink ring-1 ring-line">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="truncate text-sm text-muted">{sub}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${on ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}
      >
        {on ? onLabel : offLabel}
      </span>
    </li>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.11A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.99-3.11z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.28 6.61l3.99 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
    </svg>
  );
}

function MenuLink({
  href,
  icon,
  title,
  sub,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  badge?: number;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-brand-50/50">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink">{title}</span>
        <span className="block truncate text-sm text-muted">{sub}</span>
      </span>
      {badge ? (
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-pink-500 px-1.5 text-xs font-bold text-white">{badge}</span>
      ) : null}
      <ChevronRightIcon className="h-5 w-5 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </Link>
  );
}
