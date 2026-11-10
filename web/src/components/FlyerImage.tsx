/* eslint-disable @next/next/no-img-element -- uploads are already resized, and next/image would bill each one */

/**
 * An event flyer. `contain` shows the whole flyer (text on flyers must never be cut off) on a
 * blurred, enlarged copy of itself, so any shape fills the frame. `cover` crops, for small thumbnails.
 * Fills its parent, so give the parent a size.
 */
export default function FlyerImage({
  src,
  alt = "",
  fit = "contain",
  eager = false,
}: {
  src: string;
  alt?: string;
  fit?: "contain" | "cover";
  eager?: boolean;
}) {
  const loading = eager ? "eager" : "lazy";
  if (fit === "cover") {
    return <img src={src} alt={alt} loading={loading} decoding="async" className="h-full w-full object-cover" />;
  }
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#150833]">
      <img
        src={src}
        alt=""
        aria-hidden
        loading={loading}
        decoding="async"
        className="absolute inset-0 h-full w-full scale-125 object-cover opacity-80 blur-2xl saturate-150"
      />
      <img src={src} alt={alt} loading={loading} decoding="async" className="relative h-full w-full object-contain" />
    </div>
  );
}
