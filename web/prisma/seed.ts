import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const CAMPUS = "OOU";
const days = (n: number, hour = 20) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = (email: string, name: string, role: string) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, role, campus: CAMPUS, passwordHash },
    });

  await user("admin@easygate.test", "EasyGate Admin", "ADMIN");
  const organizer = await user("organizer@easygate.test", "OOU Vibes Ent.", "ORGANIZER");
  await user("student@easygate.test", "Ada Student", "STUDENT");
  const applicant = await user("applicant@easygate.test", "Tunde Bakare", "STUDENT");

  if ((await prisma.organizerApplication.count()) === 0) {
    await prisma.organizerApplication.create({
      data: {
        userId: applicant.id,
        orgName: "OOU Law Students' Society",
        phone: "08031234567",
        eventTypes: "Law Week, Dinner & Awards night",
        socialHandle: "@ooulss",
        message: "We host Law Week every year and want to sell dinner tickets online.",
      },
    });
  }

  if ((await prisma.event.count()) > 0) return console.log("Events already seeded");

  const events = [
    { title: "Freshers' Welcome Night", category: "PARTY", venue: "Main Campus, Ago-Iwoye", at: days(5), types: [["Regular", 2000, 300], ["VIP Table", 15000, 20]] },
    { title: "Afrobeats Live at OOU", category: "CONCERT", venue: "University Main Auditorium", at: days(12), types: [["Early Bird", 3000, 150], ["Regular", 5000, 400]] },
    { title: "Tech & Careers Summit", category: "CONFERENCE", venue: "Faculty of Engineering, Ibogun Campus", at: days(8, 10), types: [["Student Pass", 0, 500]] },
    { title: "Inter-Faculty Football Final", category: "SPORTS", venue: "OOU Sports Complex", at: days(3, 16), types: [["Stand", 500, 1000]] },
    { title: "Campus Praise Night", category: "RELIGIOUS", venue: "University Main Auditorium", at: days(10, 18), types: [["Free Entry", 0, 800]] },
    { title: "Pyjama Rave", category: "PARTY", venue: "Student Union Building", at: days(15, 21), types: [["Regular", 1500, 250], ["VIP", 6000, 30]] },
  ] as const;

  for (const [i, e] of events.entries()) {
    await prisma.event.create({
      data: {
        slug: e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + i,
        title: e.title,
        description: `${e.title} is here! Join OOU students for an unforgettable time.\n\nGates open one hour before start. Bring your student ID and your EasyGate QR ticket.`,
        category: e.category,
        campus: CAMPUS,
        venue: e.venue,
        startsAt: e.at,
        organizerId: organizer.id,
        ticketTypes: {
          create: e.types.map(([name, price, quantity]) => ({ name, priceKobo: price * 100, quantity })),
        },
      },
    });
  }
  console.log(`Seeded ${events.length} events`);
}

main().finally(() => prisma.$disconnect());
