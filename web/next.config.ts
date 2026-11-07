import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the same Wi-Fi open the dev server (http://<this PC's IP>:3000).
  allowedDevOrigins: ["192.168.252.91", "192.168.56.1"],
};

export default nextConfig;
