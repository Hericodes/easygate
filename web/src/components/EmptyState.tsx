/** Friendly empty state: a floating gradient icon tile, a title, a line of help, and an optional action. */
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
    <div className="card animate-fade-up px-6 py-14 text-center">
      <span
        className="animate-float brand-gradient mx-auto grid h-16 w-16 place-items-center rounded-2xl text-white shadow-lg shadow-brand-500/30"
        style={{ "--r": "-6deg" } as React.CSSProperties}
      >
        {icon}
      </span>
      <p className="mt-5 font-display text-xl font-bold">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{text}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
