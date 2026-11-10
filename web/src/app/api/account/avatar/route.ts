import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { handleError, jsonError } from "@/lib/api";
import { checkUploadRate, imageIdFromUrl, readImageUpload, saveImage } from "@/lib/images";

/** Removes the account's previous profile photo, if it was one we stored. */
async function deleteOldAvatar(userId: string, oldUrl: string | null) {
  const id = imageIdFromUrl(oldUrl);
  if (id) await prisma.image.deleteMany({ where: { id, uploaderId: userId, kind: "AVATAR" } });
}

/** Set a new profile photo. Multipart form with a `file` field. */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Log in first", 401);
    await checkUploadRate(user.id);
    const { bytes, mimeType } = await readImageUpload(req);
    const url = await saveImage(user.id, "AVATAR", bytes, mimeType);
    const before = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { avatarUrl: true } });
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: url } });
    await deleteOldAvatar(user.id, before.avatarUrl);
    return NextResponse.json({ avatarUrl: url });
  } catch (err) {
    return handleError(err);
  }
}

/** Remove the profile photo (back to initials). */
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Log in first", 401);
    const before = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { avatarUrl: true } });
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: null } });
    await deleteOldAvatar(user.id, before.avatarUrl);
    return NextResponse.json({ avatarUrl: null });
  } catch (err) {
    return handleError(err);
  }
}
