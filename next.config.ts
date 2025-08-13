import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Enable experimental features if needed
  },
  // Optimize for Cloud Run deployment
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Handle static file serving
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
};

export default nextConfig;