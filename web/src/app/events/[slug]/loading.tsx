export default function LoadingEvent() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8" aria-busy="true" aria-label="Loading event">
      <div className="space-y-5">
        <div className="skeleton -mx-4 -mt-2 h-[270px] sm:mx-0 sm:mt-0 sm:h-[380px] sm:rounded-[28px]" />
        <div className="card relative -mt-12 space-y-4 p-5 sm:-mt-16 sm:mx-4 sm:p-7">
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-8 w-3/4 rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
          </div>
        </div>
        <div className="skeleton h-40 rounded-3xl" />
      </div>
      <div className="skeleton h-80 rounded-3xl" />
    </div>
  );
}
