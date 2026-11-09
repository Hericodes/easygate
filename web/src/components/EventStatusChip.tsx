/** An event's review/lifecycle status: Pending review · Not approved · Live · Ended. */
export default function EventStatusChip({ status, ended }: { status: string; ended: boolean }) {
  const [cls, label] =
    status === "PENDING"
      ? ["bg-amber-50 text-amber-700", "Pending review"]
      : status === "REJECTED"
        ? ["bg-red-50 text-red-700", "Not approved"]
        : ended
          ? ["bg-zinc-100 text-zinc-600", "Ended"]
          : ["bg-emerald-50 text-emerald-700", "Live"];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>;
}
