import { destinationFor } from './redirects.mjs'

export const CONFIRM_TYPES = new Set(['signup', 'email', 'recovery', 'magiclink', 'invite', 'email_change'])

export const AUTH_FAILED_PATH = '/login?error=auth_failed'
export const LINK_EXPIRED_PATH = '/login?error=link_expired'

/** OTP links are single-use. A second open after a successful verify looks like this. */
export function isConsumedOrExpiredOtpError(error) {
  const text = `${error?.message || ''} ${error?.code || ''} ${error?.error_code || ''}`
  return /invalid or has expired|otp_expired|token not found|already been (used|consumed)|expired/i.test(text)
}

/**
 * Decide where GET /auth/confirm should send the browser.
 *
 * verifyOtp succeeds once and then returns "invalid or has expired" on reuse
 * (other device, retry, or prefetch), even when the account is already confirmed.
 * If a session already exists, send the user to their normal destination instead
 * of the sign-in error page.
 */
export async function resolveConfirmRedirect({
  tokenHash,
  type,
  next,
  origin,
  verifyOtp,
  getUser,
  roleProfile,
}) {
  const failed = `${origin}${AUTH_FAILED_PATH}`
  if (!(tokenHash && CONFIRM_TYPES.has(type))) return failed

  const { error } = await verifyOtp({ token_hash: tokenHash, type })
  if (error) {
    console.error('auth/confirm verifyOtp failed:', error.message)
    const { data: { user } = {} } = (await getUser()) || {}
    if (!user) {
      return `${origin}${isConsumedOrExpiredOtpError(error) ? LINK_EXPIRED_PATH : AUTH_FAILED_PATH}`
    }
  }

  const profile = type === 'recovery' ? null : await roleProfile()
  return `${origin}${destinationFor({ type, next, profile })}`
}
