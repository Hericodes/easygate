import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { paystackEnabled } from "@/lib/paystack";
import { naira } from "@/lib/format";
import MockPayButtons from "@/components/MockPayButtons";

export const dynamic = "force-dynamic";

/** Stand-in for Paystack's checkout page while developing without API keys. */
export default async function MockCheckout({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  if (process.env.NODE_ENV === "production" || paystackEnabled()) notFound();
  const { reference } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const order = reference
    ? await prisma.order.findUnique({
        where: { reference },
        include: { event: true, ticketType: true },
      })
    : null;
  if (!order || order.userId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Test mode.</strong> Add <code>PAYSTACK_SECRET_KEY</code> to <code>.env</code> to use
        real Paystack checkout.
      </div>
      <div className="card p-6">
        <p className="text-sm text-zinc-500">You&apos;re paying for</p>
        <h1 className="text-xl font-bold">{order.event.title}</h1>
        <p className="mt-1 text-sm">
          {order.quantity} × {order.ticketType.name}
        </p>
        <p className="mt-4 text-3xl font-bold">{naira(order.amountKobo)}</p>
        <MockPayButtons reference={order.reference} />
      </div>
    </div>
  );
}
