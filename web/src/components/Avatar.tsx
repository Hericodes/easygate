const GRADIENTS = [
  "from-brand-600 to-purple-500",
  "from-purple-500 to-pink-500",
  "from-brand-800 to-brand-500",
  "from-pink-500 to-orange-400",
  "from-indigo-500 to-brand-600",
];

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-2xl ring-4",
};

/** Initials in a colourful circle. The colour is stable per name. */
export default function Avatar({
  name,
  size = "md",
  online = false,
}: {
  name: string;
  size?: keyof typeof SIZES;
  /** Shows a small green dot (used for the signed-in user). */
  online?: boolean;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";
  const hash = [...name].reduce((n, c) => n + c.charCodeAt(0), 0);
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`grid place-items-center rounded-full bg-linear-to-br font-bold text-white shadow-md ring-2 ring-white ${GRADIENTS[hash % GRADIENTS.length]} ${SIZES[size]}`}
      >
        {initials}
      </span>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-accent ring-[3px] ring-white" />
      )}
    </span>
  );
}
