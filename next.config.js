/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Legacy URL — Drop 01 now lives at /drop/01 (permanent: true => 308).
    return [
      { source: '/drop-01', destination: '/drop/01', permanent: true },
      // The old standalone landing pages had their own header, footer and hard-coded claims. The product pages
      // are the single source of truth (real photos, sizes, price, Drop 01 window). Temporary (307) so it is
      // easy to undo.
      { source: '/snapback', destination: '/product/vibin-snapback', permanent: false },
      { source: '/lanyard', destination: '/product/lanyard', permanent: false },
      // The FAQ lives at /qa (footer already links there); people and AI tools still guess /faq.
      { source: '/faq', destination: '/qa', permanent: true },
    ]
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
