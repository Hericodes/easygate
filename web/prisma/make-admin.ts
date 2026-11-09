// Gives an existing account admin rights.
// Usage: npm run make-admin -- you@example.com           (admin)
//        npm run make-admin -- you@example.com --super   (super admin: can also add/remove admins)
// It uses DATABASE_URL from .env, so point that at the database you mean to change.
import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
const role = args.includes("--super") ? "SUPER_ADMIN" : "ADMIN";
if (!email) {
  console.error("Usage: npm run make-admin -- you@example.com [--super]");
  process.exit(1);
}

const prisma = new PrismaClient();
prisma.user
  .update({ where: { email }, data: { role } })
  .then((user) => console.log(`${user.email} is now ${role === "SUPER_ADMIN" ? "the super admin" : "an admin"}.`))
  .catch(() => {
    console.error(`No account found for ${email}. Sign up on the site first, then run this again.`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
