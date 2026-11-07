// Vercel build: checks the required settings, then applies database migrations and builds.
// Run with --check to only validate the settings.
import { execSync } from "node:child_process";

const env = { ...process.env };
const problems = [];

const db = env.DATABASE_URL ?? "";
if (!/^postgres(ql)?:\/\//.test(db)) {
  problems.push("DATABASE_URL: your Neon production connection string (starts with postgresql://).");
}
const secret = env.AUTH_SECRET ?? "";
if (secret.length < 32 || secret.startsWith("dev-only") || secret.startsWith("replace-with")) {
  problems.push("AUTH_SECRET: a long random string (32+ characters), different from your local one.");
}
if (problems.length) {
  console.error("\nMissing or invalid settings in Vercel (Project > Settings > Environment Variables, Production):");
  for (const p of problems) console.error("  - " + p);
  console.error("Add them, then redeploy.\n");
  process.exit(1);
}

if (!env.DATABASE_URL_UNPOOLED) {
  // Migrations need a direct connection. On Neon, the direct host is the pooled host without "-pooler".
  const url = new URL(db);
  url.hostname = url.hostname.replace("-pooler", "");
  env.DATABASE_URL_UNPOOLED = url.toString();
  console.log(`DATABASE_URL_UNPOOLED not set: migrations will use the direct host ${url.hostname}.`);
}

if (process.argv.includes("--check")) {
  console.log("Settings look good.");
  process.exit(0);
}

const run = (cmd) => execSync(cmd, { stdio: "inherit", env });
run("prisma generate");
run("prisma migrate deploy");
run("next build");
