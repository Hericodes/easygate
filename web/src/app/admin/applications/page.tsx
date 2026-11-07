import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { eventDate } from "@/lib/format";
import ReviewButtons from "@/components/ReviewButtons";

export const dynamic = "force-dynamic";

const BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-zinc-100 text-zinc-600",
};

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/applications");
  if (user.role !== "ADMIN") notFound();

  const apps = await prisma.organizerApplication.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }], // PENDING sorts first
  });
  const pending = apps.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organizer applications</h1>
        <p className="text-sm text-zinc-500">{pending} waiting for review</p>
      </div>
      {apps.length === 0 ? (
        <div className="card p-10 text-center text-zinc-500">No applications yet.</div>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="card flex flex-wrap gap-4 p-5">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{a.orgName}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[a.status]}`}>
                    {a.status.toLowerCase()}
                  </span>
                </div>
                <p className="text-sm text-zinc-600">
                  {a.user.name} · {a.user.email} · {a.phone}
                  {a.socialHandle && ` · ${a.socialHandle}`}
                </p>
                <p className="text-sm"><span className="text-zinc-500">Events:</span> {a.eventTypes}</p>
                {a.message && <p className="text-sm text-zinc-600">“{a.message}”</p>}
                {a.reviewNote && <p className="text-sm text-zinc-500">Note: {a.reviewNote}</p>}
                <p className="text-xs text-zinc-400">Applied {eventDate(a.createdAt)}</p>
              </div>
              {a.status === "PENDING" && <ReviewButtons id={a.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
