import { prisma } from "@/lib/db";

/**
 * Serves an uploaded picture. A picture never changes once uploaded (a new one gets a new id),
 * so browsers and Vercel's CDN may keep it for a year and the database is only read once.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = /^[a-z0-9]{20,40}$/.test(id)
    ? await prisma.image.findUnique({ where: { id }, select: { data: true, mimeType: true } })
    : null;
  if (!image) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  return new Response(Buffer.from(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.data.length),
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      // Never let the browser treat an upload as anything but a picture.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Disposition": "inline",
    },
  });
}
