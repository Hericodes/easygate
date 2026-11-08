// Vercel build: checks the required settings, then applies database migrations and builds.
// Run with --check to only validate the settings.
import { execSync } from "node:child_process";

const env = { ...process.env };

/** Why a setting is unusable, without revealing it (shows at most its first few characters). */
function whatsWrong(value, looksRight) {
  if (value === undefined) return "is not set for Production";
  const t = value.trim();
  if (!t) return "is empty";
  if (looksRight(t) && t !== value) return "has spaces or line breaks around it. Remove them";
  if (looksRight(t)) return null;
  if (/^["']/.test(t)) return "is wrapped in quote marks. Remove the quotes";
  if (/^psql\b/.test(t)) return "is a psql command. Paste only the part that starts with postgresql://";
  if (/^[A-Z_]+\s*=/.test(t)) return `has "${t.split("=")[0].trim()}=" inside the value. Paste only what comes after the =`;
  if (/^PASTE_/.test(t)) return "still has the placeholder text. Replace it with the real value";
  return `starts with "${t.slice(0, 6)}…"`;
}

const problems = [];
const dbIssue = whatsWrong(env.DATABASE_URL, (v) => /^postgres(ql)?:\/\//.test(v));
if (dbIssue) problems.push(`DATABASE_URL ${dbIssue}. It must be Neon's production connection string, starting with postgresql://`);

const secretIssue = whatsWrong(
  env.AUTH_SECRET,
  (v) => v.length >= 32 && !v.startsWith("dev-only") && !v.startsWith("replace-with"),
);
if (secretIssue) {
  const len = env.AUTH_SECRET?.trim().length ?? 0;
  const detail = secretIssue.startsWith("starts with") ? `is too weak (${len} characters)` : secretIssue;
  problems.push(`AUTH_SECRET ${detail}. It must be a long random string (32+ characters), different from your local one`);
}

const appUrl = env.APP_URL?.trim();
if (appUrl && (!appUrl.startsWith("https://") || /localhost|127\.0\.0\.1/.test(appUrl))) {
  problems.push(
    `APP_URL is "${appUrl}", which only works on your own computer. Delete APP_URL (the site's own address is used automatically) or set it to your live https:// address`,
  );
}

if (problems.length) {
  console.error("\nFix these in Vercel (Project > Settings > Environment Variables), then redeploy:");
  for (const p of problems) console.error("  - " + p);
  console.error("");
  process.exit(1);
}

if (!env.DATABASE_URL_UNPOOLED) {
  // Migrations need a direct connection. On Neon, the direct host is the pooled host without "-pooler".
  const url = new URL(env.DATABASE_URL);
  url.hostname = url.hostname.replace("-pooler", "");
  env.DATABASE_URL_UNPOOLED = url.toString();
  console.log(`DATABASE_URL_UNPOOLED not set: migrations will use the direct host ${url.hostname}.`);
}

if (process.argv.includes("--check")) {
  console.log("Settings look good.");
  process.exit(0);
}

const run = (cmd) => {
  try {
    execSync(cmd, { stdio: "inherit", env });
  } catch (error) {
    process.exit(error.status ?? 1); // the command has already printed why it failed
  }
};
run("prisma generate");
run("prisma migrate deploy");
run("node scripts/check-live-database.mjs");
run("next build");
