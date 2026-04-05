import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/admin/deposit',
        destination: '/admin/deposit-request',
        permanent: true
      }
    ];
  },
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
