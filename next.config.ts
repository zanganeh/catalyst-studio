import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint enabled for production builds
    // All lint errors should be fixed before deployment
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Disable worker threads to fix Jest worker errors
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
