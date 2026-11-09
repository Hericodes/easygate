import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Opens your next unused ticket (the phone tab bar's centre button), or My Tickets if you have none. */
export default async function NextTicket() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/tickets/next");

  const next = await prisma.ticket.findFirst({
    where: {
      userId: user.id,
      checkedInAt: null,
      event: { startsAt: { gte: new Date(Date.now() - 6 * 3600e3) } },
    },
    orderBy: { event: { startsAt: "asc" } },
    select: { code: true },
  });
  redirect(next ? `/tickets/${next.code}` : "/tickets");
}
