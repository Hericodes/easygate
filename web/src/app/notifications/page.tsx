import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications, SEEN_COOKIE, type NoticeKind } from "@/lib/notifications";
import { timeAgo } from "@/lib/format";
import EmptyState from "@/components/EmptyState";
import MarkSeen from "@/components/MarkSeen";
import {
  AlertIcon,
  BellIcon,
  CalendarIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  type IconProps,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const KINDS: Record<NoticeKind, { Icon: (p: IconProps) => React.ReactElement; tile: string }> = {
  reminder: { Icon: CalendarIcon, tile: "bg-brand-50 text-brand-600" },
  payment: { Icon: AlertIcon, tile: "bg-amber-50 text-amber-600" },
  organizer: { Icon: SparklesIcon, tile: "bg-purple-50 text-purple-600" },
  admin: { Icon: ShieldCheckIcon, tile: "bg-indigo-50 text-indigo-600" },
  sales: { Icon: TrendingUpIcon, tile: "bg-emerald-50 text-emerald-600" },
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");

  const jar = await cookies();
  const seenAt = Number(jar.get(SEEN_COOKIE)?.value) || 0;
  const prev = Number(jar.get("eg_notif_prev")?.value) || 0;
  // Right after this page marks everything seen, keep highlighting what was new on arrival.
  const newSince = Date.now() - seenAt < 60_000 ? prev : seenAt;
  const notes = await getNotifications(user);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <MarkSeen seenAt={seenAt} />
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Notifications</h1>
        <p className="mt-1 text-sm text-muted">Reminders about your events and updates on your account.</p>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="h-7 w-7" />}
          title="You're all caught up"
          text="Reminders for events you have tickets to, and other updates, will show up here."
        >
          <Link href="/events" className="btn-primary">
            Find events
          </Link>
        </EmptyState>
      ) : (
        <ul className="card animate-fade-up divide-y divide-line overflow-hidden">
          {notes.map((n) => {
            const { Icon, tile } = KINDS[n.kind];
            const isNew = n.at.getTime() > newSince;
            return (
              <li key={n.id}>
                <Link href={n.href} className="group flex items-start gap-3.5 px-4 py-4 transition-colors hover:bg-brand-50/50 sm:px-5">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tile}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className="font-bold leading-snug text-ink">{n.title}</span>
                      {isNew && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pink-500" aria-label="New" />}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{n.body}</span>
                    <span className="mt-1 block text-xs font-semibold text-muted/80">{timeAgo(n.at)}</span>
                  </span>
                  <ChevronRightIcon className="mt-3 h-5 w-5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
