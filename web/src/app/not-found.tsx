import Link from "next/link";
import { TicketIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span
        className="animate-float brand-gradient mx-auto grid h-20 w-20 place-items-center rounded-3xl text-white shadow-xl shadow-brand-500/30"
        style={{ "--r": "-8deg" } as React.CSSProperties}
      >
        <TicketIcon className="h-10 w-10" />
      </span>
      <h1 className="animate-fade-up mt-6 font-display text-4xl font-bold tracking-tight">
        This gate is <span className="gradient-text">closed</span>
      </h1>
      <p className="animate-fade-up mt-3 text-zinc-500" style={{ animationDelay: "80ms" }}>
        We couldn&apos;t find that page. The event may have been removed, or the link is wrong.
      </p>
      <Link href="/" className="btn-primary animate-fade-up mt-6" style={{ animationDelay: "160ms" }}>
        Browse events
      </Link>
    </div>
  );
}
