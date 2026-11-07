const GRADIENTS = [
  "from-brand-500 to-hot",
  "from-sun to-hot",
  "from-emerald-400 to-cyan-500",
  "from-sky-500 to-brand-500",
  "from-amber-400 to-sun",
];

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-20 w-20 text-2xl ring-4",
};

/** Initials in a colorful circle. The color is stable per name. */
export default function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof SIZES }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";
  const hash = [...name].reduce((n, c) => n + c.charCodeAt(0), 0);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-linear-to-br font-display font-bold text-white shadow-md ring-2 ring-white ${GRADIENTS[hash % GRADIENTS.length]} ${SIZES[size]}`}
    >
      {initials}
    </span>
  );
}
