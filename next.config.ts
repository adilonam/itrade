import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      },
      // Vercel Blob (profile images, app icon) – subdomain varies per store
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist']
};

export default nextConfig;
