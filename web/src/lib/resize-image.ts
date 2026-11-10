/**
 * Browser-only. Shrinks a picture and re-encodes it before upload, so uploads are fast on
 * mobile data and small in the database. Re-encoding also strips photo metadata such as GPS location.
 */

const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2.8 * 1024 * 1024;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function load(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode(); // browsers apply the photo's rotation (EXIF) when decoding
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * `maxSize`: longest side in pixels. `square`: crop to the centre square (profile photos).
 * Returns a WebP, or a JPEG on browsers that can't make WebP.
 */
export async function resizeImage(file: File, { maxSize, square = false }: { maxSize: number; square?: boolean }) {
  if (!file.type.startsWith("image/")) throw new Error("Choose a picture (JPG, PNG or WebP)");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That picture is too large. Use one under 25 MB");

  let img: HTMLImageElement;
  try {
    img = await load(file);
  } catch {
    throw new Error("We couldn't open that picture. Try a JPG or PNG");
  }

  const sw = square ? Math.min(img.naturalWidth, img.naturalHeight) : img.naturalWidth;
  const sh = square ? sw : img.naturalHeight;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  const scale = Math.min(1, maxSize / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process the picture");
  ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.86, 0.75, 0.62]) {
    let blob = await toBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
    if (blob && blob.size <= MAX_OUTPUT_BYTES) return blob;
  }
  throw new Error("That picture is too large. Try a smaller one");
}
