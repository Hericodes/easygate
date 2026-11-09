import { CrowdSilhouette } from "./Art";
import CategoryIcon from "./CategoryIcon";
import { categoryMeta } from "@/lib/format";

const TITLE_SIZE = { sm: "text-[11px]", md: "text-base", lg: "text-2xl" } as const;

/**
 * An event's cover: the organiser's flyer if they added one, otherwise a generated
 * "stage" in the event type's colours with a crowd silhouette and the event name.
 * Fills its parent, so give the parent a size.
 */
export default function EventCover({
  title,
  category,
  imageUrl,
  size = "md",
  showTitle = true,
}: {
  title: string;
  category: string;
  imageUrl?: string | null;
  size?: keyof typeof TITLE_SIZE;
  showTitle?: boolean;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />;
  }

  const [c1, c2] = categoryMeta(category).hex;
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#150833]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(55% 70% at 18% 0%, ${c1}d9, transparent 70%), radial-gradient(55% 70% at 85% 4%, ${c2}d9, transparent 70%), radial-gradient(90% 55% at 50% 115%, ${c2}80, transparent 70%)`,
        }}
      />
      {/* Stage light beams */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "conic-gradient(from 195deg at 28% -6%, transparent 0deg, rgb(255 255 255 / 0.32) 7deg, transparent 15deg), conic-gradient(from 150deg at 74% -6%, transparent 0deg, rgb(255 255 255 / 0.28) 7deg, transparent 15deg)",
        }}
      />
      {size === "lg" && (
        <CategoryIcon
          category={category}
          strokeWidth={1.2}
          className="absolute left-1/2 top-[38%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 text-white/20"
        />
      )}
      <CrowdSilhouette className="absolute inset-x-0 bottom-0 h-[46%] w-full text-[#0b0420]" />
      {showTitle && (
        <p
          className={`absolute inset-x-2 bottom-[14%] line-clamp-2 text-center font-extrabold uppercase leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_6px_rgb(0_0_0/0.6)] ${TITLE_SIZE[size]}`}
        >
          {title}
        </p>
      )}
    </div>
  );
}
