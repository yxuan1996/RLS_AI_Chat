import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "ideal-telegram-5g4vg47xw9q2vrrj-3000.app.github.dev/", "gifts-for-her-mastra-ai-chat.vercel.app"],
    },
  },
};

export default nextConfig;
