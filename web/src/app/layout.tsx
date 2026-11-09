import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { getCurrentUser, isOrganizer } from "@/lib/auth";
import { countUnread, SEEN_COOKIE } from "@/lib/notifications";
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EasyGate: OOU events and tickets",
  description: "Discover parties, concerts and programs at Olabisi Onabanjo University and get your ticket in seconds.",
  applicationName: "EasyGate",
  appleWebApp: { capable: true, title: "EasyGate", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#faf9ff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const seenAt = Number((await cookies()).get(SEEN_COOKIE)?.value) || 0;
  const unread = user ? await countUnread(user, seenAt) : 0;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${jakarta.variable} ${geistMono.variable} font-sans antialiased`}>
        <Header user={user} unread={unread} />
        <main className="mx-auto max-w-6xl px-4 pb-8 pt-2 sm:pt-6">{children}</main>
        <Footer />
        <BottomNavigation loggedIn={Boolean(user)} organizer={isOrganizer(user)} />
      </body>
    </html>
  );
}
