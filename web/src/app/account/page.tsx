import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isOrganizer } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";
import PasswordForm from "@/components/PasswordForm";
import LogoutButton from "@/components/LogoutButton";
import Avatar from "@/components/Avatar";
import { ReceiptIcon, SparklesIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  ORGANIZER: "Organizer",
  ADMIN: "Admin",
};

export default async function AccountPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/account");
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: {
      name: true,
      email: true,
      phone: true,
      role: true,
      campus: true,
      createdAt: true,
      passwordHash: true,
      googleId: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="card animate-fade-up overflow-hidden">
        <div aria-hidden className="brand-gradient animated-gradient relative h-24">
          <div className="dot-pattern absolute inset-0 opacity-40" />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <Avatar name={user.name} size="lg" />
            <div className="pb-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">{user.name}</h1>
              <p className="text-sm text-zinc-500">
                {ROLE_LABEL[user.role] ?? user.role} · {user.campus ?? "OOU"} · Joined{" "}
                {new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(user.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/tickets/history" className="btn-ghost">
              <ReceiptIcon className="h-4 w-4" /> Ticket history
            </Link>
            {!isOrganizer(session) && (
              <Link href="/organizers/apply" className="btn-ghost">
                <SparklesIcon className="h-4 w-4" /> Become an organizer
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="card animate-fade-up p-6" style={{ animationDelay: "80ms" }}>
        <h2 className="mb-4 font-bold">Profile</h2>
        <ProfileForm initial={{ name: user.name, email: user.email, phone: user.phone ?? "" }} />
      </section>

      <section className="card animate-fade-up p-6" style={{ animationDelay: "140ms" }}>
        <h2 className="font-bold">{user.passwordHash ? "Change password" : "Set a password"}</h2>
        <p className="mb-4 text-sm text-zinc-500">
          {user.googleId
            ? user.passwordHash
              ? "You can sign in with Google or with your email and password."
              : "You sign in with Google. Add a password if you also want to log in with your email."
            : "Use at least 8 characters."}
        </p>
        <PasswordForm hasPassword={Boolean(user.passwordHash)} />
      </section>

      <section className="card animate-fade-up flex items-center justify-between p-6" style={{ animationDelay: "200ms" }}>
        <div>
          <h2 className="font-bold">Log out</h2>
          <p className="text-sm text-zinc-500">Sign out of EasyGate on this device.</p>
        </div>
        <LogoutButton className="btn-ghost" />
      </section>
    </div>
  );
}
