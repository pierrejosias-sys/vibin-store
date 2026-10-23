/** Edge-safe early-access helpers (no node: imports) — used by middleware. */
export const EARLY_ACCESS_COOKIE = 'vibin_ea'
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/
export function isWellFormedToken(t) {
  return typeof t === 'string' && TOKEN_RE.test(t)
}
