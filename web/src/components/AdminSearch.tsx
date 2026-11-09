import { SearchIcon } from "./icons";

/** Small GET search form for admin lists. `hidden` keeps other filters (like the active tab). */
export default function AdminSearch({
  action,
  q,
  placeholder,
  hidden = {},
}: {
  action: string;
  q?: string;
  placeholder: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form action={action} role="search" className="flex w-full items-center gap-2 rounded-full bg-white p-1 pl-4 ring-1 ring-line sm:w-80">
      <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent py-1.5 text-base outline-none placeholder:text-muted sm:text-sm"
      />
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button className="btn-soft h-9 px-4 text-xs">Search</button>
    </form>
  );
}
