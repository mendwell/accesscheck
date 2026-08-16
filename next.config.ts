import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@netlify/database"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
