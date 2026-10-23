import test from 'node:test'
import assert from 'node:assert/strict'
import { safeNext, destinationFor } from '../app/auth/redirects.mjs'

test('safeNext blocks open redirects', () => {
  assert.equal(safeNext('/profile'), '/profile')
  assert.equal(safeNext('//evil.com'), '/profile')
  assert.equal(safeNext('/\\evil.com'), '/profile')
  assert.equal(safeNext('https://evil.com'), '/profile')
  assert.equal(safeNext(null), '/profile')
})

test('destinationFor: recovery -> reset page, roles, next', () => {
  assert.equal(destinationFor({ type: 'recovery', next: '/admin' }), '/reset-password')
  assert.equal(destinationFor({ type: 'signup', profile: { is_admin: true } }), '/admin')
  assert.equal(destinationFor({ type: 'email', profile: { is_ambassador: true } }), '/ambassador')
  assert.equal(destinationFor({ type: 'magiclink', next: '/drop/01', profile: {} }), '/drop/01')
  assert.equal(destinationFor({ type: 'email' }), '/profile')
})
