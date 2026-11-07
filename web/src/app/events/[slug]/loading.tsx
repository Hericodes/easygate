export default function LoadingEvent() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading event">
      <div className="skeleton h-80 rounded-[2rem] sm:h-96" />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="skeleton h-24 rounded-3xl" />
            <div className="skeleton h-24 rounded-3xl" />
          </div>
          <div className="skeleton h-48 rounded-3xl" />
        </div>
        <div className="skeleton h-96 rounded-3xl" />
      </div>
    </div>
  );
}
