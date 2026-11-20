import test from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveConfirmRedirect,
  isConsumedOrExpiredOtpError,
  AUTH_FAILED_PATH,
  LINK_EXPIRED_PATH,
} from '../app/auth/confirm-email.mjs'

const origin = 'https://vibinapparel.com'
const expired = { message: 'Email link is invalid or has expired', code: 'otp_expired' }

function stubs({ verifyError = null, user = null, profile = {} } = {}) {
  const calls = { verifyOtp: 0, getUser: 0, roleProfile: 0 }
  return {
    calls,
    verifyOtp: async () => { calls.verifyOtp += 1; return { error: verifyError } },
    getUser: async () => { calls.getUser += 1; return { data: { user } } },
    roleProfile: async () => { calls.roleProfile += 1; return profile },
  }
}

test('isConsumedOrExpiredOtpError matches the live verify failure', () => {
  assert.equal(isConsumedOrExpiredOtpError(expired), true)
  assert.equal(isConsumedOrExpiredOtpError({ message: 'One-time token not found', error_code: 'otp_expired' }), true)
  assert.equal(isConsumedOrExpiredOtpError({ message: 'Invalid login credentials' }), false)
})

test('successful verify redirects to the role destination', async () => {
  const s = stubs({ profile: { is_admin: true } })
  const loc = await resolveConfirmRedirect({
    tokenHash: 'pkce_unused', type: 'email', origin, ...s,
  })
  assert.equal(loc, `${origin}/admin`)
  assert.equal(s.calls.verifyOtp, 1)
  assert.equal(s.calls.getUser, 0)
  assert.equal(s.calls.roleProfile, 1)
})

test('successful verify honors ?next and recovery type', async () => {
  const s = stubs({ profile: {} })
  const nextLoc = await resolveConfirmRedirect({
    tokenHash: 'hash', type: 'signup', next: '/drop/01', origin, ...s,
  })
  assert.equal(nextLoc, `${origin}/drop/01`)

  const rec = stubs()
  const recLoc = await resolveConfirmRedirect({
    tokenHash: 'hash', type: 'recovery', origin, ...rec,
  })
  assert.equal(recLoc, `${origin}/reset-password`)
  assert.equal(rec.calls.roleProfile, 0)
})

test('verify failure with an existing session still redirects normally', async () => {
  const s = stubs({
    verifyError: expired,
    user: { id: 'aa84f429-c712-4e6c-8b2b-f042cdbd4a43' },
    profile: { is_admin: true },
  })
  const loc = await resolveConfirmRedirect({
    tokenHash: 'pkce_used', type: 'email', origin, ...s,
  })
  assert.equal(loc, `${origin}/admin`)
  assert.equal(s.calls.getUser, 1)
  assert.equal(s.calls.roleProfile, 1)
  assert.ok(!loc.includes('error='))
})

test('verify failure with a session and ?next uses the safe next path', async () => {
  const s = stubs({
    verifyError: expired,
    user: { id: 'user-1' },
    profile: {},
  })
  const loc = await resolveConfirmRedirect({
    tokenHash: 'pkce_used', type: 'email', next: '/profile', origin, ...s,
  })
  assert.equal(loc, `${origin}/profile`)
})

test('expired token and no session goes to link_expired, not auth_failed', async () => {
  const s = stubs({ verifyError: expired, user: null })
  const loc = await resolveConfirmRedirect({
    tokenHash: 'pkce_used', type: 'email', origin, ...s,
  })
  assert.equal(loc, `${origin}${LINK_EXPIRED_PATH}`)
  assert.ok(!loc.includes('auth_failed'))
  assert.equal(s.calls.roleProfile, 0)
})

test('unexpected verify error with no session stays on auth_failed', async () => {
  const s = stubs({ verifyError: { message: 'Auth retryable error' }, user: null })
  const loc = await resolveConfirmRedirect({
    tokenHash: 'hash', type: 'email', origin, ...s,
  })
  assert.equal(loc, `${origin}${AUTH_FAILED_PATH}`)
})

test('missing token or type goes to auth_failed without calling verify', async () => {
  const s = stubs()
  const missing = await resolveConfirmRedirect({ tokenHash: null, type: 'email', origin, ...s })
  const badType = await resolveConfirmRedirect({ tokenHash: 'hash', type: 'not-a-type', origin, ...s })
  assert.equal(missing, `${origin}${AUTH_FAILED_PATH}`)
  assert.equal(badType, `${origin}${AUTH_FAILED_PATH}`)
  assert.equal(s.calls.verifyOtp, 0)
})
