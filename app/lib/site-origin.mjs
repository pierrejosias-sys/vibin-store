/** Allowed checkout return origins. Never trust a raw Origin header. */
export const DEFAULT_SITE_ORIGIN = 'https://vibinapparel.com'

export function allowedOrigins(env = process.env) {
  const extra = [env.NEXT_PUBLIC_SITE_URL, env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null]
    .filter(Boolean)
    .map(s => String(s).trim().replace(/\/$/, ''))
  return new Set([
    DEFAULT_SITE_ORIGIN,
    'https://www.vibinapparel.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...extra,
  ])
}

/** Prefer a same-site Origin when it is on the allow-list; otherwise the canonical site URL. */
export function siteOrigin(request, env = process.env) {
  const allowed = allowedOrigins(env)
  const origin = request?.headers?.get?.('origin')
  if (origin && allowed.has(origin)) return origin
  const configured = env.NEXT_PUBLIC_SITE_URL && String(env.NEXT_PUBLIC_SITE_URL).trim().replace(/\/$/, '')
  return configured || DEFAULT_SITE_ORIGIN
}
