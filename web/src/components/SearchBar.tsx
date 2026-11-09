import { SearchIcon } from "./icons";

/** Search box that opens the Explore page with the results. */
export default function SearchBar({
  q,
  category,
  className = "",
}: {
  q?: string;
  category?: string;
  className?: string;
}) {
  return (
    <form
      action="/events"
      role="search"
      className={`flex items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-[0_14px_34px_-18px_rgb(59_7_100/0.35)] ring-1 ring-line sm:pl-5 ${className}`}
    >
      <SearchIcon className="h-5 w-5 shrink-0 text-brand-600" strokeWidth={2.2} />
      <input
        name="q"
        defaultValue={q}
        aria-label="Search events"
        placeholder="Search parties, concerts, venues…"
        className="min-w-0 flex-1 bg-transparent py-2 text-base text-ink outline-none placeholder:text-muted sm:text-[15px]"
      />
      {category && <input type="hidden" name="category" value={category} />}
      <button className="btn-primary h-11 px-5 sm:px-7">Search</button>
    </form>
  );
}
