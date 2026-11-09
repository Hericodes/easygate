/** Friendly empty state: a floating gradient icon with soft rings, a title, a line of help, and an optional action. */
export default function EmptyState({
  icon,
  title,
  text,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card animate-fade-up relative overflow-hidden px-6 py-12 text-center sm:py-14">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-6 h-40 w-40 -translate-x-1/2 rounded-full bg-brand-100/60 blur-2xl" />
      <div className="relative mx-auto grid h-24 w-24 place-items-center">
        <span aria-hidden className="absolute inset-0 rounded-full border border-dashed border-brand-200" />
        <span aria-hidden className="absolute inset-3 rounded-full bg-brand-50" />
        <span
          className="animate-float primary-gradient relative grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg shadow-brand-600/30"
          style={{ "--r": "-6deg" } as React.CSSProperties}
        >
          {icon}
        </span>
      </div>
      <p className="relative mt-5 text-lg font-bold text-ink">{title}</p>
      <p className="relative mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>
      {children && <div className="relative mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
