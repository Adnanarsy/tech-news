import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Allow unoptimized images for Azure Blob Storage
    unoptimized: false,
  },
  // Disable source maps in development to avoid warnings
  productionBrowserSourceMaps: false,
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {
    // Turbopack handles source maps differently, warnings are less common
  },
};

export default nextConfig;
