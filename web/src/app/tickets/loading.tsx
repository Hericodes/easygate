export default function LoadingTickets() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading tickets">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-8 w-44 rounded-xl" />
          <div className="skeleton h-4 w-64 rounded-lg" />
        </div>
        <div className="skeleton h-11 w-64 rounded-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card flex gap-3.5 p-2.5">
            <div className="skeleton h-28 w-24 shrink-0 rounded-[18px]" />
            <div className="flex-1 space-y-2.5 py-1">
              <div className="skeleton h-4 w-24 rounded-full" />
              <div className="skeleton h-5 w-4/5 rounded-lg" />
              <div className="skeleton h-4 w-3/5 rounded-lg" />
              <div className="skeleton h-4 w-2/5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
