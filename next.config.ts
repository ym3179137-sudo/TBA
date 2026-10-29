import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // This forces Turbopack to look in D:\TBA\baby-academy for node_modules
    root: path.resolve(__dirname),
  },
  eslint: {
    // 🚨 This allows production builds to successfully complete even if
    // your project has ESLint errors. (Prevents Vercel build failures).
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 🚨 Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;