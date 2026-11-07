export default function LoadingTickets() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading tickets">
      <div className="flex items-center justify-between">
        <div className="skeleton h-9 w-44 rounded-xl" />
        <div className="skeleton h-11 w-52 rounded-2xl" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-3xl bg-white">
            <div className="skeleton h-32" />
            <div className="space-y-3 p-5">
              <div className="skeleton mx-auto h-44 w-44 rounded-xl" />
              <div className="skeleton mx-auto h-4 w-32 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
