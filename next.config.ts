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
