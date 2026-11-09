import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { isSuperAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { ShieldCheckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [pendingEvents, pendingApplications] = await Promise.all([
    prisma.event.count({ where: { status: "PENDING" } }),
    prisma.organizerApplication.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="primary-gradient grid h-11 w-11 place-items-center rounded-2xl text-white shadow-lg shadow-brand-600/30">
          <ShieldCheckIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold leading-tight">Admin</h1>
          <p className="text-sm text-muted">
            Signed in as {user.name} · {isSuperAdmin(user) ? "Super admin" : "Admin"}
          </p>
        </div>
      </div>
      <AdminNav pendingEvents={pendingEvents} pendingApplications={pendingApplications} />
      {children}
    </div>
  );
}
