// Refuses to deploy against a database that holds the demo accounts: that is the dev database,
// and its admin password is public (it's in the README).
import { createRequire } from "node:module";

const { PrismaClient } = createRequire(import.meta.url)("@prisma/client");
const prisma = new PrismaClient();

try {
  const demoAccounts = await prisma.user.count({ where: { email: { endsWith: "@easygate.test" } } });
  if (demoAccounts > 0) {
    console.error("\nDATABASE_URL points at a database with the demo accounts (...@easygate.test).");
    console.error("That is your dev database, and its passwords are public.");
    console.error("In Vercel, set DATABASE_URL and DATABASE_URL_UNPOOLED to Neon's production branch, then redeploy.\n");
    process.exitCode = 1;
  } else {
    console.log("Database check passed: no demo accounts.");
  }
} finally {
  await prisma.$disconnect();
}
