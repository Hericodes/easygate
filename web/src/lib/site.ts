/**
 * The site's public address, used to build full links (e.g. share-preview pictures).
 * APP_URL if set, otherwise Vercel's production domain, otherwise the local dev server.
 */
export function siteUrl() {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
