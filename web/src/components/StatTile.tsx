/** A headline number: label, value, optional hint, with a small icon chip. Compact on phones. */
export default function StatTile({
  label,
  value,
  hint,
  icon,
  delay = 0,
  className = "",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={`card animate-fade-up p-4 sm:p-5 ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-500 sm:text-sm">{label}</p>
        <span aria-hidden className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-600 sm:h-9 sm:w-9">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
