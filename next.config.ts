import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  typescript: {
    // 🚨 Ignores ALL TypeScript errors during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;