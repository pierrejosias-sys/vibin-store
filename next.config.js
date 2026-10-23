/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Legacy URL — Drop 01 now lives at /drop/01 (permanent: true => 308).
    return [{ source: '/drop-01', destination: '/drop/01', permanent: true }]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'user-gen-media-assets.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
};

module.exports = nextConfig;
