import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/suggestion',
        destination: '/ai-suggestion',
        permanent: false,
      },
    ];
  },
  images: {
    // 75 is Next's default; 90 is for screenshots of the app, whose small
    // interface text blurs at 75 (the homepage Room Studio steps).
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        pathname: '/**',
      },
      {
        // Product photography for the LivLab catalogue.
        protocol: 'https',
        hostname: 'luxbath.vn',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
