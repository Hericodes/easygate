import { NextResponse } from "next/server";
import { getCurrentUser, isOrganizer } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";
import { checkUploadRate, deleteUnusedFlyers, readImageUpload, saveImage } from "@/lib/images";

/**
 * Upload an event flyer (organizers). Multipart form with a `file` field.
 * Returns `{ url }`; send that as `imageUrl` when creating the event.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Log in first", 401);
    if (!isOrganizer(user)) return jsonError("Only organizers can upload flyers", 403);
    await checkUploadRate(user.id);
    const { bytes, mimeType } = await readImageUpload(req);
    const url = await saveImage(user.id, "FLYER", bytes, mimeType);
    await deleteUnusedFlyers(user.id);
    return NextResponse.json({ url });
  } catch (err) {
    return handleError(err);
  }
}
