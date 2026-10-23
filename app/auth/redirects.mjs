/** Only allow same-site relative paths as post-auth destinations (no //host or scheme). */
export function safeNext(next, fallback = '/profile') {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}

/** Where to send a user after a verified email link. */
export function destinationFor({ type, next, profile }) {
  if (type === 'recovery') return '/reset-password'
  if (profile?.is_admin) return '/admin'
  if (profile?.is_ambassador) return '/ambassador'
  return safeNext(next)
}
