// Gives an existing account admin rights (approve organizers, manage everything).
// Usage: npm run make-admin -- you@example.com
// It uses DATABASE_URL from .env, so point that at the database you mean to change.
import { PrismaClient } from "@prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run make-admin -- you@example.com");
  process.exit(1);
}

const prisma = new PrismaClient();
prisma.user
  .update({ where: { email }, data: { role: "ADMIN" } })
  .then((user) => console.log(`${user.email} is now an admin.`))
  .catch(() => {
    console.error(`No account found for ${email}. Sign up on the site first, then run this again.`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
