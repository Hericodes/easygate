import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isOrganizer } from "@/lib/auth";
import { countUnread, SEEN_COOKIE } from "@/lib/notifications";
import Avatar from "@/components/Avatar";
import LogoutButton from "@/components/LogoutButton";
import PasswordForm from "@/components/PasswordForm";
import ProfileForm from "@/components/ProfileForm";
import { CrowdSilhouette } from "@/components/Art";
import {
  BellIcon,
  ChevronRightIcon,
  DashboardIcon,
  PencilIcon,
  ReceiptIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { STUDENT: "Student", ORGANIZER: "Organizer", ADMIN: "Admin" };

export default async function AccountPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/account");
  const seenAt = Number((await cookies()).get(SEEN_COOKIE)?.value) || 0;

  const [user, ticketCount, unread] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.id },
      select: { name: true, email: true, phone: true, role: true, campus: true, createdAt: true, passwordHash: true, googleId: true },
    }),
    prisma.ticket.count({ where: { userId: session.id } }),
    countUnread(session, seenAt),
  ]);
  const organizer = isOrganizer(session);
  const joined = new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(user.createdAt);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="card animate-fade-up overflow-hidden">
        <div aria-hidden className="hero-surface relative h-28 sm:h-32">
          <CrowdSilhouette className="absolute inset-x-0 bottom-0 h-14 w-full text-[#12042a]/60" />
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-10 flex items-end gap-4">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0 pb-1">
              <h1 className="truncate text-xl font-extrabold sm:text-2xl">{user.name}</h1>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">{ROLE_LABEL[user.role] ?? user.role}</span>
            <span className="rounded-full bg-page px-3 py-1 text-muted ring-1 ring-line">{user.campus ?? "OOU"}</span>
            <span className="rounded-full bg-page px-3 py-1 text-muted ring-1 ring-line">Joined {joined}</span>
          </div>
        </div>
      </section>

      <nav aria-label="Account" className="card animate-fade-up divide-y divide-line overflow-hidden" style={{ animationDelay: "60ms" }}>
        <MenuLink href="/tickets" icon={<TicketIcon className="h-5 w-5" />} title="My tickets" sub={ticketCount === 1 ? "1 ticket" : `${ticketCount} tickets`} />
        <MenuLink href="/tickets/history" icon={<ReceiptIcon className="h-5 w-5" />} title="Order history" sub="Payments and receipts" />
        <MenuLink
          href="/notifications"
          icon={<BellIcon className="h-5 w-5" />}
          title="Notifications"
          sub={unread ? `${unread} new` : "You're all caught up"}
          badge={unread}
        />
        {organizer ? (
          <MenuLink href="/organizer" icon={<DashboardIcon className="h-5 w-5" />} title="Organizer dashboard" sub="Your events, sales and check-ins" />
        ) : (
          <MenuLink href="/organizers/apply" icon={<SparklesIcon className="h-5 w-5" />} title="Become an organizer" sub="Sell tickets for your events" />
        )}
        {user.role === "ADMIN" && (
          <MenuLink href="/admin/applications" icon={<ShieldCheckIcon className="h-5 w-5" />} title="Review applications" sub="Approve new organizers" />
        )}
      </nav>

      <section id="profile" className="card animate-fade-up scroll-mt-24 p-5 sm:p-6" style={{ animationDelay: "120ms" }}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
          <PencilIcon className="h-5 w-5 text-brand-600" /> Edit profile
        </h2>
        <ProfileForm initial={{ name: user.name, email: user.email, phone: user.phone ?? "" }} />
      </section>

      <section id="settings" className="card animate-fade-up scroll-mt-24 p-5 sm:p-6" style={{ animationDelay: "180ms" }}>
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <SettingsIcon className="h-5 w-5 text-brand-600" /> {user.passwordHash ? "Change password" : "Set a password"}
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          {user.googleId
            ? user.passwordHash
              ? "You can sign in with Google or with your email and password."
              : "You sign in with Google. Add a password if you also want to log in with your email."
            : "Use at least 8 characters."}
        </p>
        <PasswordForm hasPassword={Boolean(user.passwordHash)} />
      </section>

      <LogoutButton className="btn-ghost w-full py-3.5 text-red-600" />
    </div>
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
    <Link href={href} className="group flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-brand-50/50 sm:px-6">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icon}</span>
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
