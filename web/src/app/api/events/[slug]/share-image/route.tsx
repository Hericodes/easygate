import { ImageResponse } from "next/og";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { imageIdFromUrl } from "@/lib/images";
import { categoryMeta, dateParts, lowestPrice, naira } from "@/lib/format";

export const runtime = "nodejs";

const W = 1200;
const H = 630;

/**
 * The picture WhatsApp, X, Facebook, Telegram and iMessage show when someone shares an event link:
 * the whole flyer in the middle on a gradient in its main colour (so a square crop still shows all of it),
 * or a branded card with the event details when there's no flyer. Sent as a small JPEG, because some
 * apps don't show WebP previews and WhatsApp drops large pictures.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      title: true,
      venue: true,
      startsAt: true,
      category: true,
      imageUrl: true,
      status: true,
      published: true,
      ticketTypes: { select: { priceKobo: true, quantity: true, sold: true } },
    },
  });
  if (!event || !event.published || event.status !== "APPROVED") {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const flyer = await loadFlyer(event.imageUrl);
  const jpeg = (flyer && (await flyerCard(flyer))) || (await detailsCard(event));

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(jpeg.length),
      // Events can change (e.g. one taken down), so cache for a day rather than forever.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

/** The flyer's bytes: from our own uploads, or (for older events) the outside link. */
async function loadFlyer(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const id = imageIdFromUrl(url);
    if (id) {
      const image = await prisma.image.findUnique({ where: { id }, select: { data: true } });
      return image ? Buffer.from(image.data) : null;
    }
    if (!url.startsWith("https://")) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length > 0 && bytes.length < 10 * 1024 * 1024 ? bytes : null;
  } catch {
    return null;
  }
}

/* ---------- Fonts (downloaded once per server instance) ---------- */

type Font = { name: string; data: ArrayBuffer; weight: 600 | 800; style: "normal" };
let fontsPromise: Promise<Font[]> | null = null;

/** The site's font, Plus Jakarta Sans, from Google Fonts. If that fails, pictures use the built-in font. */
function loadFonts(): Promise<Font[]> {
  fontsPromise ??= Promise.all(
    ([600, 800] as const).map(async (weight) => {
      const css = await (
        await fetch(`https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@${weight}`, {
          signal: AbortSignal.timeout(3000),
        })
      ).text();
      const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
      if (!src) throw new Error("no font file");
      const data = await (await fetch(src, { signal: AbortSignal.timeout(3000) })).arrayBuffer();
      return { name: "Jakarta", data, weight, style: "normal" as const };
    }),
  ).catch(() => {
    fontsPromise = null; // try again next time
    return [];
  });
  return fontsPromise;
}

/* ---------- Flyer card ---------- */

const BADGE_W = 230;
const BADGE_H = 56;
let badgePromise: Promise<Buffer> | null = null;

/** The small "EasyGate" pill as a transparent PNG (the same for every event, so it's made once). */
function badge(): Promise<Buffer> {
  badgePromise ??= (async () => {
    const fonts = await loadFonts();
    const image = new ImageResponse(
      (
        <div
          style={{
            width: BADGE_W,
            height: BADGE_H,
            display: "flex",
            justifyContent: "flex-end",
            fontFamily: fonts.length ? "Jakarta" : undefined,
          }}
        >
          <Brand label="EasyGate" small />
        </div>
      ),
      { width: BADGE_W, height: BADGE_H, fonts: fonts.length ? fonts : undefined },
    );
    return Buffer.from(await image.arrayBuffer());
  })().catch((err) => {
    badgePromise = null;
    throw err;
  });
  return badgePromise;
}

/**
 * The flyer's main colour: the average of its most colourful pixels, so white text or a dark
 * corner doesn't turn the background grey. Grey flyers get their plain average.
 */
async function mainColour(image: Buffer) {
  const { data } = await sharp(image).resize(16, 16, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels: { r: number; g: number; b: number; sat: number }[] = [];
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const light = (max + min) / 510;
    if (light < 0.1 || light > 0.9) continue;
    pixels.push({ r, g, b, sat: (max - min) / 255 });
  }
  const pick = pixels.sort((a, b) => b.sat - a.sat).slice(0, Math.max(1, Math.ceil(pixels.length * 0.3)));
  if (!pixels.length || pick[0].sat < 0.12) return { r: 60, g: 40, b: 90 }; // grey or empty: brand purple-grey
  const avg = (k: "r" | "g" | "b") => pick.reduce((n, p) => n + p[k], 0) / pick.length;
  return { r: avg("r"), g: avg("g"), b: avg("b") };
}

const svg = (body: string, w = W, h = H) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);

/** The flyer, whole, with rounded corners and a soft shadow, on a gradient in its main colour. */
async function flyerCard(flyer: Buffer): Promise<Buffer | null> {
  try {
    const sized = await sharp(flyer)
      .rotate()
      .resize({ width: W - 120, height: H - 64, fit: "inside" })
      .toBuffer({ resolveWithObject: true });
    const dominant = await mainColour(sized.data);
    const { width: fw, height: fh } = sized.info;
    const left = Math.round((W - fw) / 2);
    const top = Math.round((H - fh) / 2);
    const shade = (f: number) =>
      `rgb(${Math.round(dominant.r * f)},${Math.round(dominant.g * f)},${Math.round(dominant.b * f)})`;

    // (Blurring the flyer itself for the background leaves smudges of its text, so use its main colour.)
    const background = svg(`
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${shade(0.8)}"/>
          <stop offset="0.5" stop-color="${shade(0.45)}"/>
          <stop offset="1" stop-color="${shade(0.18)}"/>
        </linearGradient>
        <linearGradient id="v" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#080314" stop-opacity="0.45"/>
          <stop offset="0.3" stop-color="#080314" stop-opacity="0"/>
          <stop offset="0.7" stop-color="#080314" stop-opacity="0"/>
          <stop offset="1" stop-color="#080314" stop-opacity="0.45"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <rect width="${W}" height="${H}" fill="url(#v)"/>`);

    const rounded = await sharp(sized.data)
      .composite([{ input: svg(`<rect width="${fw}" height="${fh}" rx="22" ry="22"/>`, fw, fh), blend: "dest-in" }])
      .png()
      .toBuffer();
    // Layers can't be bigger than the picture, so the shadow is drawn on a full-size layer.
    const shadow = await sharp(
      svg(`<rect x="${left}" y="${top + 18}" width="${fw}" height="${fh}" rx="22" fill="#000" fill-opacity="0.55"/>`),
    )
      .blur(22)
      .png()
      .toBuffer();

    const layers: sharp.OverlayOptions[] = [
      { input: shadow, left: 0, top: 0 },
      { input: rounded, left, top },
    ];
    // The badge goes in the space beside the flyer, only if there's room (wide flyers fill the picture).
    if ((W - fw) / 2 >= BADGE_W + 32) {
      const pill = await badge().catch(() => null);
      if (pill) layers.push({ input: pill, left: W - BADGE_W - 28, top: H - BADGE_H - 28 });
    }

    return await sharp(background).composite(layers).jpeg({ quality: 82 }).toBuffer();
  } catch (err) {
    console.error("Share picture: couldn't use the flyer", err);
    return null; // fall back to the details card
  }
}

/* ---------- Card for events without a flyer ---------- */

async function detailsCard(event: {
  title: string;
  venue: string;
  startsAt: Date;
  category: string;
  ticketTypes: { priceKobo: number; quantity: number; sold: number }[];
}) {
  const cat = categoryMeta(event.category);
  const [c1, c2] = cat.hex;
  const d = dateParts(event.startsAt);
  const price = lowestPrice(event.ticketTypes);
  const title = event.title.length > 70 ? `${event.title.slice(0, 67).trimEnd()}…` : event.title;
  const fonts = await loadFonts();
  const priceText = price === 0 ? "Free entry" : `From ${naira(price)}`;
  // The built-in font has no naira sign.
  const shownPrice = fonts.length ? priceText : priceText.replace("₦", "NGN ");

  const image = new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          color: "#ffffff",
          backgroundColor: "#2a0650",
          backgroundImage: `linear-gradient(135deg, ${c1} 0%, ${c2} 55%, #26054a 100%)`,
          fontFamily: fonts.length ? "Jakarta" : undefined,
          fontWeight: 600,
        }}
      >
        <Brand />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, opacity: 0.85 }}>{cat.label.toUpperCase()}</div>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 40 ? 64 : 80,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              marginTop: 14,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 30, opacity: 0.95 }}>
            <div style={{ display: "flex" }}>{`${d.weekday}, ${d.day} ${d.month} · ${d.time}`}</div>
            <div style={{ display: "flex", marginTop: 6, opacity: 0.85 }}>{event.venue}</div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "16px 30px",
              borderRadius: 999,
              backgroundColor: "#ffffff",
              color: "#17152b",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            {shownPrice}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fonts.length ? fonts : undefined },
  );
  return sharp(Buffer.from(await image.arrayBuffer())).jpeg({ quality: 82 }).toBuffer();
}

/** The EasyGate badge: ticket mark plus a label. */
function Brand({ label = "Tickets on EasyGate", small = false }: { label?: string; small?: boolean }) {
  const mark = small ? 38 : 44;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        alignSelf: "flex-start",
        padding: small ? "8px 18px 8px 8px" : "10px 22px 10px 10px",
        borderRadius: 999,
        backgroundColor: "rgba(10,4,28,0.55)",
        border: "1px solid rgba(255,255,255,0.22)",
      }}
    >
      <div
        style={{
          width: mark,
          height: mark,
          borderRadius: small ? 12 : 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #a855f7, #6415f5)",
        }}
      >
        <svg
          width={small ? 22 : 26}
          height={small ? 22 : 26}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
      </div>
      <div style={{ display: "flex", marginLeft: small ? 10 : 12, fontSize: small ? 23 : 26, color: "#ffffff" }}>{label}</div>
    </div>
  );
}
