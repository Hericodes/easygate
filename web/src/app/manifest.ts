import type { MetadataRoute } from "next";

/** Makes EasyGate installable ("Add to Home Screen") so it opens full-screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EasyGate: OOU events and tickets",
    short_name: "EasyGate",
    description: "Discover OOU parties, concerts and programs and get your ticket in seconds.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#3b0764",
    theme_color: "#faf9ff",
    categories: ["entertainment", "events", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My tickets", url: "/tickets", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Explore events", url: "/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
