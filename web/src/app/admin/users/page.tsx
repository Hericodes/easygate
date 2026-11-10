import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { isSuperAdmin, ROLE_LABEL } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import AdminSearch from "@/components/AdminSearch";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import UserRoleActions from "@/components/UserRoleActions";
import { UsersIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const FILTERS = [
  ["ALL", "Everyone"],
  ["STUDENT", "Students"],
  ["ORGANIZER", "Organizers"],
  ["ADMIN", "Admins"],
] as const;

const ROLE_CHIP: Record<string, string> = {
  STUDENT: "bg-zinc-100 text-zinc-700",
  ORGANIZER: "bg-purple-50 text-purple-700",
  ADMIN: "bg-brand-50 text-brand-700",
  SUPER_ADMIN: "primary-gradient text-white",
};

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const me = await requireAdmin("/admin/users");
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const role = FILTERS.some(([v]) => v === sp.role) ? sp.role! : "ALL";
  const superAdmin = isSuperAdmin(me);

  const users = await prisma.user.findMany({
    where: {
      ...(role === "ADMIN" ? { role: { in: ["ADMIN", "SUPER_ADMIN"] } } : role !== "ALL" ? { role } : {}),
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { tickets: true, events: true } },
    },
  });

  // Which roles the signed-in admin may give each account (none for themselves or the super admin).
  const optionsFor = (u: { id: string; role: string }) => {
    if (u.id === me.id || u.role === "SUPER_ADMIN") return null;
    if (u.role === "ADMIN") return superAdmin ? ["ADMIN", "ORGANIZER", "STUDENT"] : null;
    return superAdmin ? ["STUDENT", "ORGANIZER", "ADMIN"] : ["STUDENT", "ORGANIZER"];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map(([value, label]) => (
            <Link
              key={value}
              href={`/admin/users?role=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                role === value ? "bg-ink text-white ring-ink" : "bg-white text-muted ring-line hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <AdminSearch action="/admin/users" q={q} placeholder="Search name or email" hidden={{ role }} />
      </div>

      {!superAdmin && (
        <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          You can switch accounts between Student and Organizer. Only the super admin can add or remove admins.
        </p>
      )}

      {users.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-7 w-7" />} title="No accounts found" text="Try a different search." />
      ) : (
        <ul className="card animate-fade-up divide-y divide-line overflow-hidden">
          {users.map((u) => {
            const options = optionsFor(u);
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
                <Avatar name={u.name} src={u.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-bold text-ink">{u.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_CHIP[u.role] ?? ROLE_CHIP.STUDENT}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                    {u.id === me.id && <span className="text-[11px] font-semibold text-muted">(you)</span>}
                  </div>
                  <p className="truncate text-sm text-muted">{u.email}</p>
                  <p className="text-xs text-muted">
                    Joined {timeAgo(u.createdAt)} · {u._count.tickets} tickets · {u._count.events} events
                  </p>
                </div>
                {options && <UserRoleActions id={u.id} role={u.role} options={options} />}
              </li>
            );
          })}
        </ul>
      )}
      {users.length === 50 && <p className="text-center text-xs text-muted">Showing the 50 newest matches. Search to find others.</p>}
    </div>
  );
}
