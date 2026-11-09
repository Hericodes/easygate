import Link from "next/link";
import { LogoMark } from "./Logo";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-32 pt-6 text-sm text-muted sm:pb-10">
      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size="sm" />
          <p>
            © {new Date().getFullYear()} <span className="font-bold text-ink">EasyGate</span> · Built for OOU
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5">
          <Link href="/events" className="py-2 transition-colors hover:text-brand-600">Explore events</Link>
          <Link href="/tickets" className="py-2 transition-colors hover:text-brand-600">My tickets</Link>
          <Link href="/organizers/apply" className="py-2 transition-colors hover:text-brand-600">Become an organizer</Link>
        </nav>
      </div>
    </footer>
  );
}
