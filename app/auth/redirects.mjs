/** Only allow same-site relative paths as post-auth destinations (no //host or scheme). */
export function safeNext(next, fallback = '/profile') {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}

/** Default landing page for a role when no ?next was asked for. */
export function roleHome(profile) {
  if (profile?.is_admin) return '/admin'
  if (profile?.is_ambassador) return '/ambassador'
  return '/profile'
}

/**
 * Where to send a user after signing in: the page they were sent away from (?next, same-site only),
 * else their role's home. The login page and the email-link routes both use this.
 */
export function afterLogin({ next, profile } = {}) {
  const wanted = safeNext(next, null)
  return wanted && !wanted.startsWith('/login') ? wanted : roleHome(profile)
}

/** Where to send a user after a verified email link. */
export function destinationFor({ type, next, profile }) {
  if (type === 'recovery') return '/reset-password'
  return afterLogin({ next, profile })
}
