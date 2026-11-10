import { prisma } from "./db";

/**
 * Uploaded pictures (event flyers, profile photos).
 * The browser shrinks and re-encodes every picture before upload (see lib/resize-image.ts),
 * so files are small; the server still checks the real file type and size.
 */

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // Vercel accepts request bodies up to 4.5 MB
const HOURLY_UPLOAD_LIMIT = 40;

export type ImageKind = "FLYER" | "AVATAR";

/** The public address of an uploaded picture. */
export const imageUrl = (id: string) => `/api/images/${id}`;

/** The id inside one of our own picture addresses, or null for anything else. */
export function imageIdFromUrl(url: string | null | undefined) {
  const m = url?.match(/^\/api\/images\/([a-z0-9]{20,40})$/);
  return m ? m[1] : null;
}

/** Works out the type from the file's first bytes, ignoring what the browser claims. Only JPEG, PNG and WebP are accepted. */
function sniff(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (
    b.length > 12 &&
    String.fromCharCode(b[0], b[1], b[2], b[3]) === "RIFF" &&
    String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP"
  )
    return "image/webp";
  return null;
}

export class UploadError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Reads the `file` field of a multipart request and checks it's a real, small enough picture. */
export async function readImageUpload(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new UploadError("Send the picture as a file upload");
  }
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) throw new UploadError("Choose a picture to upload");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("That picture is too large. Use one under 3 MB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniff(bytes);
  if (!mimeType) throw new UploadError("Use a JPG, PNG or WebP picture");
  return { bytes, mimeType };
}

/** Stops one account filling the database with uploads. */
export async function checkUploadRate(userId: string) {
  const recent = await prisma.image.count({
    where: { uploaderId: userId, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= HOURLY_UPLOAD_LIMIT) throw new UploadError("Too many uploads. Try again in an hour", 429);
}

export async function saveImage(userId: string, kind: ImageKind, bytes: Uint8Array, mimeType: string) {
  const image = await prisma.image.create({
    data: { uploaderId: userId, kind, mimeType, size: bytes.length, data: bytes },
    select: { id: true },
  });
  return imageUrl(image.id);
}

/**
 * Deletes this account's flyers that were uploaded over a day ago but never used on an event
 * (e.g. the organizer picked a different picture, or never submitted the form).
 */
export async function deleteUnusedFlyers(userId: string) {
  const old = await prisma.image.findMany({
    where: { uploaderId: userId, kind: "FLYER", createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    select: { id: true },
  });
  if (!old.length) return;
  const used = await prisma.event.findMany({
    where: { imageUrl: { in: old.map((i) => imageUrl(i.id)) } },
    select: { imageUrl: true },
  });
  const usedIds = new Set(used.map((e) => imageIdFromUrl(e.imageUrl)));
  const unused = old.map((i) => i.id).filter((id) => !usedIds.has(id));
  if (unused.length) await prisma.image.deleteMany({ where: { id: { in: unused }, uploaderId: userId } });
}

/** True if `url` is a flyer this account uploaded. */
export async function ownsFlyer(userId: string, url: string) {
  const id = imageIdFromUrl(url);
  if (!id) return false;
  const image = await prisma.image.findFirst({ where: { id, uploaderId: userId, kind: "FLYER" }, select: { id: true } });
  return Boolean(image);
}
