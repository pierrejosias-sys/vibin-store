import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { afterLogin, destinationFor, roleHome } from '../app/auth/redirects.mjs'

test('afterLogin honors a same-site ?next before the role home', () => {
  assert.equal(afterLogin({ next: '/ambassador/apply', profile: {} }), '/ambassador/apply')
  assert.equal(afterLogin({ next: '/drop/01', profile: { is_admin: true } }), '/drop/01')
  assert.equal(afterLogin({ next: '/admin', profile: { is_admin: true } }), '/admin')
})

test('afterLogin falls back to the role home for missing, unsafe or login next values', () => {
  assert.equal(afterLogin({ profile: { is_admin: true } }), '/admin')
  assert.equal(afterLogin({ next: '', profile: { is_ambassador: true } }), '/ambassador')
  assert.equal(afterLogin({ next: '//evil.com', profile: {} }), '/profile')
  assert.equal(afterLogin({ next: 'https://evil.com', profile: {} }), '/profile')
  assert.equal(afterLogin({ next: '/login?error=x', profile: {} }), '/profile')
  assert.equal(roleHome(null), '/profile')
})

test('email links keep recovery first, then ?next, then role', () => {
  assert.equal(destinationFor({ type: 'recovery', next: '/ambassador/apply' }), '/reset-password')
  assert.equal(destinationFor({ type: 'magiclink', next: '/ambassador/apply', profile: { is_admin: true } }), '/ambassador/apply')
})

test('middleware no longer role-gates /ambassador (apply, login and hub are reachable)', () => {
  const src = readFileSync(new URL('../middleware.js', import.meta.url), 'utf8')
  assert.doesNotMatch(src, /'\/ambassador\/:path\*'/)
  assert.doesNotMatch(src, /protectedRoutes = \[[^\]]*'\/ambassador'/)
  assert.match(src, /protectedRoutes = \['\/admin', '\/profile', '\/support-agent'\]/)
  assert.doesNotMatch(src, /'\/ambassador'/, 'ambassador stays public')
  assert.match(src, /if \(!profile\?\.is_admin\)/)
})

test('login page sends the visitor to ?next after sign-in', () => {
  const src = readFileSync(new URL('../app/login/page.js', import.meta.url), 'utf8')
  assert.match(src, /afterLogin\(\{ next, profile \}\)/)
})
