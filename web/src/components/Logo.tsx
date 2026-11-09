import Link from "next/link";
import { TicketIcon } from "./icons";

/** The gradient ticket tile on its own. */
export function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8 rounded-xl" : "h-11 w-11 rounded-2xl";
  const icon = size === "sm" ? "h-4.5 w-4.5" : "h-6 w-6";
  return (
    <span className={`brand-gradient grid shrink-0 place-items-center text-white shadow-lg shadow-brand-600/30 ${box}`}>
      <TicketIcon className={icon} strokeWidth={2.2} />
    </span>
  );
}

/** Logo tile, wordmark and tagline, linking home. */
export default function Logo() {
  return (
    <Link href="/" aria-label="EasyGate home" className="group flex items-center gap-2.5">
      <span className="transition duration-300 group-hover:-rotate-6">
        <LogoMark />
      </span>
      <span className="leading-none">
        <span className="block text-[21px] font-extrabold tracking-tight text-ink">
          Easy<span className="text-brand-600">Gate</span>
        </span>
        <span className="mt-1 block text-[11px] font-medium text-muted">Events. Tickets. Memories.</span>
      </span>
    </Link>
  );
}
