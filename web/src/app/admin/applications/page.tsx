import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { timeAgo } from "@/lib/format";
import { ROLE_LABEL, isOrganizer } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import ReviewButtons from "@/components/ReviewButtons";
import { SparklesIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const BADGE: Record<string, [string, string]> = {
  PENDING: ["bg-amber-50 text-amber-700", "Waiting"],
  APPROVED: ["bg-emerald-50 text-emerald-700", "Approved"],
  REJECTED: ["bg-zinc-100 text-zinc-600", "Not approved"],
};

export default async function ApplicationsPage() {
  await requireAdmin("/admin/applications");
  const apps = await prisma.organizerApplication.findMany({
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }], // PENDING sorts first
    take: 100,
  });

  if (apps.length === 0) {
    return (
      <EmptyState
        icon={<SparklesIcon className="h-7 w-7" />}
        title="No applications yet"
        text="When students apply to become organizers, their applications appear here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {apps.map((a) => {
        const [cls, label] = BADGE[a.status] ?? BADGE.PENDING;
        return (
          <li key={a.id} className="card animate-fade-up flex flex-wrap gap-4 p-4 sm:p-5">
            <Avatar name={a.user.name} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-extrabold text-ink">{a.orgName}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
              </div>
              <p className="text-sm text-muted">
                {a.user.name} · {a.user.email} · {a.phone}
                {a.socialHandle && ` · ${a.socialHandle}`}
              </p>
              <p className="text-sm text-ink">
                <span className="text-muted">Plans to host: </span>
                {a.eventTypes}
              </p>
              {a.message && <p className="rounded-xl bg-page px-3 py-2 text-sm text-ink/80 ring-1 ring-line">“{a.message}”</p>}
              {a.reviewNote && <p className="text-sm text-muted">Reason given: {a.reviewNote}</p>}
              {a.status === "PENDING" && isOrganizer(a.user) && (
                <p className="text-sm font-medium text-primary">
                  Already has {ROLE_LABEL[a.user.role]} access. Approving won&apos;t change their role.
                </p>
              )}
              <p className="text-xs text-muted">Applied {timeAgo(a.createdAt)}</p>
            </div>
            {a.status === "PENDING" && <ReviewButtons id={a.id} />}
          </li>
        );
      })}
    </ul>
  );
}
