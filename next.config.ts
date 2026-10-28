// next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // This forces Turbopack to look in D:\TBA\baby-academy for node_modules
    root: path.resolve(__dirname),
  },
};

export default nextConfig;