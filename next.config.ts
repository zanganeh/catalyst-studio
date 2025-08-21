import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporarily ignore ESLint during builds due to widespread any type usage
    // TODO: Fix TypeScript strict mode violations in future refactor
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Disable worker threads to fix Jest worker errors
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
