import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so stray lockfiles in parent folders can't
  // shift Turbopack's module resolution.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
