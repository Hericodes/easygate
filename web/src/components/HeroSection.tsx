import Link from "next/link";
import { CrowdSilhouette, GateSilhouette } from "./Art";
import SearchBar from "./SearchBar";
import { ArrowRightIcon, CircleCheckIcon, QrIcon, ShieldCheckIcon, StarIcon, type IconProps } from "./icons";

const TRUST: { Icon: (p: IconProps) => React.ReactElement; text: string }[] = [
  { Icon: QrIcon, text: "Instant QR tickets" },
  { Icon: ShieldCheckIcon, text: "Secure Paystack checkout" },
  { Icon: CircleCheckIcon, text: "Verified organizers" },
];

/** Homepage hero: headline, trust points, Explore button, illustration, and the search bar. */
export default function HeroSection() {
  return (
    <div>
      <section className="hero-surface relative isolate overflow-hidden rounded-[28px] px-5 pb-14 pt-5 text-white shadow-[0_28px_60px_-28px_rgb(59_7_100/0.75)] sm:rounded-[36px] sm:px-10 sm:pb-16 sm:pt-9">
        <HeroArt />

        <div className="relative z-10">
          <p className="animate-fade-up inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold ring-1 ring-white/15 backdrop-blur sm:text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              OOU&apos;s home for event tickets
          </p>
          <div className="max-w-[60%] sm:max-w-[54%]">
            <h1
              className="animate-fade-up mt-4 text-[1.75rem] font-extrabold leading-[1.1] tracking-tight min-[400px]:text-[1.95rem] sm:text-5xl lg:text-[3.6rem]"
              style={{ animationDelay: "70ms" }}
            >
              Find what&apos;s happening <span className="text-brand-200">at</span>{" "}
              <span className="block bg-linear-to-r from-[#c9b0ff] via-purple-400 to-pink-300 bg-clip-text text-[2.5rem] leading-[1.05] text-transparent sm:text-6xl lg:text-7xl">
                OOU.
              </span>
            </h1>
            <p className="animate-fade-up mt-2 text-[15px] font-semibold text-white/90 sm:text-xl" style={{ animationDelay: "140ms" }}>
              Get your ticket in seconds.
            </p>
          </div>

          <div className="mt-6 sm:max-w-[54%]">
            <p className="animate-fade-up max-w-md text-[13.5px] leading-relaxed text-white/70 sm:text-base" style={{ animationDelay: "200ms" }}>
              No more asking around for who&apos;s selling. Browse events, pay securely, and walk in with a QR code on
              your phone.
            </p>
            <ul className="animate-fade-up mt-4 space-y-2.5" style={{ animationDelay: "260ms" }}>
              {TRUST.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[13.5px] font-semibold sm:text-sm">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/12 ring-1 ring-white/15">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <Link
              href="/events"
              className="btn-white animate-fade-up mt-6 gap-3 py-2 pl-6 pr-2 text-[15px]"
              style={{ animationDelay: "320ms" }}
            >
              Explore Events
              <span className="primary-gradient grid h-9 w-9 place-items-center rounded-full text-white">
                <ArrowRightIcon className="h-4 w-4" strokeWidth={2.4} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <SearchBar className="relative z-10 mx-2 -mt-7 sm:mx-10" />
    </div>
  );
}

/** The illustration: OOU gate, crowd, a 3D-style "OOU EVENTS" ticket in an orbit ring, and a calendar. */
function HeroArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -right-20 -top-16 h-72 w-72 rounded-full bg-purple-500/40 blur-3xl" />
      <div className="absolute -bottom-12 left-1/4 h-40 w-72 rounded-full bg-pink-500/25 blur-3xl" />
      <GateSilhouette className="absolute right-2 top-3 h-[112px] w-[164px] text-white/[0.13] sm:right-12 sm:top-6 sm:h-[200px] sm:w-[292px]" />
      <CrowdSilhouette className="absolute inset-x-0 bottom-0 h-[84px] w-full text-[#12042a]/85 sm:hidden" />
      <CrowdSilhouette repeat={3} className="absolute inset-x-0 bottom-0 hidden h-[110px] w-full text-[#12042a]/85 sm:block" />
      <div className="absolute right-[-12px] top-[86px] h-[280px] w-[280px] origin-top-right scale-[0.6] min-[400px]:scale-[0.66] sm:right-8 sm:top-1/2 sm:-translate-y-1/2 sm:scale-90 lg:right-20 lg:scale-105">
        <HeroTicket />
      </div>
    </div>
  );
}

function HeroTicket() {
  const ring: React.CSSProperties = {
    background:
      "linear-gradient(transparent, transparent) padding-box, linear-gradient(90deg, #f59e0b, #ec4899 50%, #a855f7) border-box",
    border: "7px solid transparent",
    rotate: "10deg",
  };
  const notches =
    "radial-gradient(circle 11px at calc(100% - 60px) 0, #0000 97%, #000) top / 100% 51% no-repeat, radial-gradient(circle 11px at calc(100% - 60px) 100%, #0000 97%, #000) bottom / 100% 51% no-repeat";

  return (
    <div className="relative h-full w-full">
      <span className="absolute left-[46px] top-[14px] h-7 w-2 -rotate-[28deg] rounded-full bg-amber-400" />
      <span className="absolute left-[68px] top-[4px] h-5 w-2 rotate-[8deg] rounded-full bg-amber-300" />
      <span className="absolute left-[24px] top-[42px] h-2 w-6 -rotate-12 rounded-full bg-amber-400" />

      <div className="animate-float absolute left-[22px] top-[38px] h-[138px] w-[240px]" style={{ "--r": "-16deg" } as React.CSSProperties}>
        {/* back half of the orbit ring (behind the ticket) */}
        <span className="absolute -left-[36px] top-[24px] h-[96px] w-[310px] rounded-[50%]" style={{ ...ring, clipPath: "inset(0 0 52% 0)" }} />
        <div
          className="absolute inset-0 rounded-[22px] bg-linear-to-br from-white via-[#f4eeff] to-[#d6c3ff] shadow-[0_26px_40px_-14px_rgb(8_0_30/0.7)]"
          style={{ WebkitMask: notches, mask: notches }}
        >
          <div className="absolute inset-y-[11px] left-[11px] right-[72px] rounded-[15px] border-2 border-dashed border-brand-300/70" />
          <div className="absolute bottom-[14px] right-[59px] top-[14px] border-l-2 border-dashed border-brand-300" />
          <div className="absolute right-[18px] top-1/2 h-[92px] w-[26px] -translate-y-1/2 rounded-[8px] bg-[repeating-linear-gradient(0deg,#3b0764_0_3px,transparent_3px_7px)] opacity-25" />
          <p className="absolute left-[30px] top-[22px] -rotate-6 text-[42px] font-black leading-none tracking-tight text-brand-900">OOU</p>
          <p className="absolute left-[30px] top-[66px] -rotate-6 text-[26px] font-black leading-none tracking-tight text-brand-600">EVENTS</p>
          <span className="absolute right-[76px] top-[14px] grid h-8 w-8 place-items-center rounded-full bg-amber-400 text-white shadow-md">
            <StarIcon className="h-4 w-4" strokeWidth={2.6} />
          </span>
        </div>
        {/* front half of the orbit ring */}
        <span className="absolute -left-[36px] top-[24px] z-10 h-[96px] w-[310px] rounded-[50%]" style={{ ...ring, clipPath: "inset(48% 0 0 0)" }} />
      </div>

      <div
        className="animate-float absolute bottom-[6px] right-[14px] h-[124px] w-[130px]"
        style={{ "--r": "6deg", animationDelay: "-2.5s" } as React.CSSProperties}
      >
        <div className="relative h-full w-full rounded-[24px] bg-white p-3 shadow-[0_22px_38px_-14px_rgb(8_0_30/0.65)]">
          <span className="absolute -top-2 left-7 h-6 w-3 rounded-full bg-amber-400 ring-2 ring-white" />
          <span className="absolute -top-2 right-7 h-6 w-3 rounded-full bg-amber-400 ring-2 ring-white" />
          <div className="primary-gradient h-5 rounded-lg" />
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }, (_, i) => (
              <span
                key={i}
                className={`h-4 rounded-[5px] ${i === 5 ? "bg-pink-400" : i % 3 === 0 ? "bg-brand-600" : "bg-brand-200"}`}
              />
            ))}
          </div>
        </div>
        <div className="absolute -bottom-4 -right-4 grid h-[60px] w-[60px] place-items-center rounded-full bg-white shadow-lg ring-[5px] ring-brand-600">
          <span className="absolute left-1/2 top-[13px] h-[18px] w-[3px] -translate-x-1/2 rounded-full bg-brand-900" />
          <span className="absolute left-1/2 top-1/2 h-[3px] w-[13px] -translate-y-1/2 rounded-full bg-brand-900" />
          <span className="relative h-2 w-2 rounded-full bg-brand-900" />
        </div>
      </div>
    </div>
  );
}
