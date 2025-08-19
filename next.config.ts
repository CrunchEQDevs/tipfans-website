// next.config.ts
import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // 🚫 desligar typedRoutes que gera type-check quebrado
    typedRoutes: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "secure.gravatar.com" },
      { protocol: "https", hostname: "0.gravatar.com" },
      { protocol: "https", hostname: "1.gravatar.com" },
      { protocol: "https", hostname: "2.gravatar.com" },
      { protocol: "https", hostname: "s.w.org" },
      { protocol: "https", hostname: "tipfans.com" },
      { protocol: "https", hostname: "www.tipfans.com" },
    ],
  },
} satisfies NextConfig;

export default nextConfig;
