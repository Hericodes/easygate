import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "./auth";

/** For admin pages: sends visitors to log in, and hides the page from non-admins. */
export async function requireAdmin(path = "/admin") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (!isAdmin(user)) notFound();
  return user;
}
