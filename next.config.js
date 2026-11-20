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

  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.supabase.co https://va.vercel-scripts.com https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
      "font-src 'self' https://fonts.gstatic.com https://vercel.live https://assets.vercel.com data:",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://user-gen-media-assets.s3.amazonaws.com https://api.qrserver.com https://images.unsplash.com https://files.cdn.printful.com https://*.stripe.com https://vercel.live https://vercel.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.stripe.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://vercel.live wss://ws-us3.pusher.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://vercel.live",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ')
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
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
      {
        // Printful mockups for made-to-order products (also allowed in CSP img-src)
        protocol: 'https',
        hostname: 'files.cdn.printful.com',
      },
    ],
  },
};

module.exports = nextConfig;
