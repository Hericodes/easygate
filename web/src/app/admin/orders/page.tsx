import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { eventDate, money } from "@/lib/format";
import AdminSearch from "@/components/AdminSearch";
import EmptyState from "@/components/EmptyState";
import { ReceiptIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const FILTERS = [
  ["ALL", "All"],
  ["PAID", "Paid"],
  ["PENDING", "Not completed"],
  ["FAILED", "Failed"],
] as const;

const STATUS: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-zinc-100 text-zinc-600",
  FAILED: "bg-red-50 text-red-700",
};

/** Look up payments, e.g. when a student says "I paid but have no ticket". */
export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin("/admin/orders");
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const status = FILTERS.some(([v]) => v === sp.status) ? sp.status! : "ALL";

  const orders = await prisma.order.findMany({
    where: {
      ...(status === "ALL" ? {} : { status }),
      ...(q
        ? {
            OR: [
              { reference: { contains: q, mode: "insensitive" as const } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
              { user: { name: { contains: q, mode: "insensitive" as const } } },
              { event: { title: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
      event: { select: { title: true, slug: true } },
      ticketType: { select: { name: true } },
      _count: { select: { tickets: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map(([value, label]) => (
            <Link
              key={value}
              href={`/admin/orders?status=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                status === value ? "bg-ink text-white ring-ink" : "bg-white text-muted ring-line hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <AdminSearch action="/admin/orders" q={q} placeholder="Reference, email, name or event" hidden={{ status }} />
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<ReceiptIcon className="h-7 w-7" />} title="No orders found" text="Try another filter or search." />
      ) : (
        <ul className="card animate-fade-up divide-y divide-line overflow-hidden">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">
                  {o.quantity} × {o.ticketType.name} ·{" "}
                  <Link href={`/events/${o.event.slug}`} className="hover:text-brand-700">
                    {o.event.title}
                  </Link>
                </p>
                <p className="truncate text-sm text-muted">
                  {o.user.name} · {o.user.email}
                </p>
                <p className="text-xs text-muted">
                  <span className="font-mono">{o.reference}</span> · {eventDate(o.createdAt)} · {o._count.tickets} ticket
                  {o._count.tickets === 1 ? "" : "s"} issued
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums text-ink">{money(o.amountKobo)}</p>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS[o.status] ?? STATUS.PENDING}`}>
                  {o.status === "PENDING" ? "Not completed" : o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
