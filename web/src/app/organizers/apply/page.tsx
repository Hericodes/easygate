import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, isOrganizer } from "@/lib/auth";
import ApplyForm from "@/components/ApplyForm";
import { CrowdSilhouette, GateSilhouette } from "@/components/Art";
import { CheckIcon, CreditCardIcon, ScanIcon, ShieldCheckIcon, TrendingUpIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const PERKS = [
  { Icon: CreditCardIcon, title: "Sell tickets online", text: "Students pay with card, transfer or USSD through Paystack." },
  { Icon: ShieldCheckIcon, title: "No fake tickets", text: "Every ticket has a unique QR code that works only once." },
  { Icon: ScanIcon, title: "Scan at the gate", text: "Check guests in with your phone camera." },
  { Icon: TrendingUpIcon, title: "Track sales live", text: "See tickets sold, revenue and attendance in your dashboard." },
];

export default async function ApplyPage() {
  const user = await getCurrentUser();
  const application = user
    ? await prisma.organizerApplication.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_440px]">
      <section>
        <div className="hero-surface animate-fade-up relative isolate overflow-hidden rounded-[28px] p-6 text-white sm:p-8">
          <GateSilhouette className="absolute -right-4 top-4 -z-10 h-32 w-48 text-white/[0.12] sm:right-6 sm:h-40 sm:w-60" />
          <CrowdSilhouette className="absolute inset-x-0 bottom-0 -z-10 h-16 w-full text-[#12042a]/70" />
          <p className="inline-block rounded-full bg-white/12 px-3 py-1 text-xs font-bold ring-1 ring-white/15">
            For OOU clubs, associations &amp; promoters
          </p>
          <h1 className="mt-4 max-w-md text-3xl font-extrabold leading-tight sm:text-4xl">
            Host your event on <span className="gradient-text-light">EasyGate</span>
          </h1>
          <p className="mt-3 max-w-lg pb-6 text-white/75">
            To keep events on EasyGate genuine, organizers are verified before they can sell tickets. Apply here and
            we&apos;ll review your application, usually within 48 hours.
          </p>
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {PERKS.map(({ Icon, title, text }, i) => (
            <li
              key={title}
              className="group card animate-fade-up p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ animationDelay: `${180 + i * 70}ms` }}
            >
              <span
                aria-hidden
                className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition duration-300 group-hover:brand-gradient group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand-500/30"
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 font-semibold">{title}</p>
              <p className="text-sm text-zinc-500">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <aside className="card animate-fade-up self-start p-6" style={{ animationDelay: "150ms" }}>
        {!user ? (
          <div className="space-y-3 text-center">
            <h2 className="text-lg font-bold">First, create a free account</h2>
            <p className="text-sm text-zinc-500">You&apos;ll apply with your EasyGate account.</p>
            <Link href="/signup?next=/organizers/apply" className="btn-primary w-full">Sign up</Link>
            <Link href="/login?next=/organizers/apply" className="btn-ghost w-full">I have an account</Link>
          </div>
        ) : isOrganizer(user) ? (
          <div className="space-y-3 text-center">
            <span className="brand-gradient mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg shadow-brand-500/30">
              <CheckIcon className="h-7 w-7" />
            </span>
            <h2 className="text-lg font-bold">You&apos;re an approved organizer</h2>
            <Link href="/organizer" className="btn-primary w-full">Go to dashboard</Link>
          </div>
        ) : application?.status === "PENDING" ? (
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-bold">Application under review</h2>
            <p className="text-sm text-zinc-500">
              We received your application for <strong>{application.orgName}</strong>. We&apos;ll
              contact you on {application.phone}. Once approved, the organizer dashboard appears
              in your menu.
            </p>
          </div>
        ) : (
          <>
            {application?.status === "REJECTED" && (
              <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Your last application wasn&apos;t approved
                {application.reviewNote ? `: ${application.reviewNote}` : "."} You can apply again.
              </div>
            )}
            <h2 className="mb-4 text-lg font-bold">Organizer application</h2>
            <ApplyForm />
          </>
        )}
      </aside>
    </div>
  );
}
