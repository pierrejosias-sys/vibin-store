/**
 * ADMIN_EMAILS allowlist helpers. No Next runtime — safe for middleware and tests.
 * The env value itself is never logged or returned.
 */

export function adminEmailsFromEnv(env = process.env) {
  return String(env.ADMIN_EMAILS || '')
    .split(/[,;\s]+/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
}

/** If the allowlist is empty, returns true (is_admin is still required by requireAdmin). */
export function isAllowlistedEmail(email, env = process.env) {
  const list = adminEmailsFromEnv(env)
  if (!list.length) return true
  return !!(email && list.includes(String(email).toLowerCase()))
}
