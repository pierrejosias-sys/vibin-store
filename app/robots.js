export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/checkout/',
          '/cart/',
          '/profile/',
          '/login/',
          '/forgot-password/',
        ]
      }
    ],
    sitemap: 'https://vibinapparel.com/sitemap.xml',
    host: 'https://vibinapparel.com'
  }
}
