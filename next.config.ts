import type { NextConfig } from "next";

// The browser only talks to the frontend origin: /api/v1 is proxied to the backend. That keeps cookies same-origin and
// avoids CORS and Chrome's block on public pages calling localhost (Private Network Access), e.g. behind a dev tunnel.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.devtunnels.ms"],
  experimental: { proxyTimeout: 120_000 }, // the advisory chat can take a minute
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${API_PROXY_TARGET}/api/v1/:path*` }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
