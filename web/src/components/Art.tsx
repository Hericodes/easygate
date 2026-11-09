// Decorative SVG artwork shared across the site (all purely visual: aria-hidden).

type ArtProps = { className?: string };

type Arms = "up" | "one" | "none";

function person(key: string, x: number, headY: number, r: number, arms: Arms, seed: number) {
  const y = headY + ((seed * 37) % 9) - 4;
  const sw = r * 1.75; // half shoulder width
  const armWidth = r * 1.15;
  return (
    <g key={key}>
      <circle cx={x} cy={y} r={r} />
      <path
        d={`M${x - sw} 120 L${x - sw} ${y + r * 2.6} Q${x - sw} ${y + r * 1.25} ${x} ${y + r * 1.25} Q${x + sw} ${y + r * 1.25} ${x + sw} ${y + r * 2.6} L${x + sw} 120 Z`}
      />
      {arms !== "none" && (
        <path
          d={`M${x - sw * 0.7} ${y + r * 1.9} L${x - sw * 1.3} ${y - r * 2.5}`}
          stroke="currentColor"
          strokeWidth={armWidth}
          strokeLinecap="round"
        />
      )}
      {arms === "up" && (
        <path
          d={`M${x + sw * 0.7} ${y + r * 1.9} L${x + sw * 1.3} ${y - r * 2.5}`}
          stroke="currentColor"
          strokeWidth={armWidth}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

/** A concert crowd with raised hands, drawn along the bottom edge. Colour with text-*. */
export function CrowdSilhouette({
  className = "",
  rows = 2,
  repeat = 1,
}: ArtProps & { rows?: 1 | 2; /** Wider crowds for wide areas, so heads stay small. */ repeat?: number }) {
  const back = Array.from({ length: 18 * repeat }, (_, i) =>
    person(`b${i}`, 6 + i * 23.5, 60, 7.5, i % 4 === 2 ? "up" : i % 5 === 0 ? "one" : "none", i),
  );
  const front = Array.from({ length: 12 * repeat }, (_, i) =>
    person(`f${i}`, 14 + i * 34, 86, 10.5, i % 3 === 1 ? "up" : i % 4 === 3 ? "one" : "none", i + 3),
  );
  return (
    <svg
      viewBox={`0 0 ${400 * repeat} 120`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      {rows === 2 && <g opacity="0.55">{back}</g>}
      <g>{front}</g>
    </svg>
  );
}

/** A university gate with "OOU" on its name plate. Colour with text-*. */
export function GateSilhouette({ className = "" }: ArtProps) {
  // Inner edge of the arch: a quadratic curve from (38,78) through control (110,18) to (182,78).
  const archY = (x: number) => {
    const t = (x - 38) / 144;
    return 80 - 120 * t * (1 - t);
  };
  return (
    <svg viewBox="0 0 220 150" className={className} fill="currentColor" aria-hidden>
      <rect x="8" y="40" width="30" height="110" rx="3" />
      <rect x="4" y="31" width="38" height="11" rx="2" />
      <rect x="182" y="40" width="30" height="110" rx="3" />
      <rect x="178" y="31" width="38" height="11" rx="2" />
      <path d="M38 70 Q110 6 182 70 L182 80 Q110 18 38 80 Z" />
      {Array.from({ length: 13 }, (_, i) => {
        const x = 45 + i * 10.6;
        const top = archY(x + 1.5);
        return <rect key={i} x={x} y={top} width="3" height={150 - top} rx="1.5" />;
      })}
      <rect x="82" y="16" width="56" height="24" rx="5" />
      <text x="110" y="33" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2a0650">
        OOU
      </text>
    </svg>
  );
}
