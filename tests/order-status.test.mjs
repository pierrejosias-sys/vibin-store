import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveOrderStatus, isValidOrderId, isValidSessionId, STATUS_COPY } from '../app/lib/order-status.mjs'

const SID = 'cs_test_a1qCHqnN1XWIxCqGa20C4flxne4e13O1aZ'
const order = (o = {}) => ({ id: 5, status: 'pending', stripe_session_id: SID, ...o })
const session = (s = {}) => ({ id: SID, status: 'complete', payment_status: 'paid', metadata: { orderId: '5' }, ...s })

test('validates inputs', () => {
  assert.ok(isValidOrderId('5'))
  for (const bad of ['', 'abc', '5;drop', null, undefined, '1'.repeat(13)]) assert.equal(isValidOrderId(bad), false)
  assert.ok(isValidSessionId(SID))
  assert.ok(isValidSessionId('cs_live_' + 'a'.repeat(40)))
  for (const bad of ['', 'true', 'cs_test_', 'pi_123', '{CHECKOUT_SESSION_ID}', null]) assert.equal(isValidSessionId(bad), false)
})

test('?success=true alone (no order / no session) is unknown, never paid', () => {
  assert.equal(resolveOrderStatus(null, SID, session()), 'unknown')
  assert.equal(resolveOrderStatus(order(), undefined, session()), 'unknown')
  assert.equal(resolveOrderStatus(order(), 'true', session()), 'unknown')
})

test('session id must match the stored order session', () => {
  assert.equal(resolveOrderStatus(order({ status: 'paid' }), 'cs_test_' + 'x'.repeat(30), null), 'unknown')
  assert.equal(resolveOrderStatus(order({ stripe_session_id: null }), SID, session()), 'unknown')
})

test('stripe session for another order is unknown', () => {
  assert.equal(resolveOrderStatus(order(), SID, session({ metadata: { orderId: '6' } })), 'unknown')
})

test('paid order row is paid', () => {
  assert.equal(resolveOrderStatus(order({ status: 'paid' }), SID, null), 'paid')
})

test('webhook not landed yet but Stripe says paid -> paid', () => {
  assert.equal(resolveOrderStatus(order(), SID, session()), 'paid')
})

test('unpaid open/processing session -> pending; stripe unreachable -> pending', () => {
  assert.equal(resolveOrderStatus(order(), SID, session({ status: 'complete', payment_status: 'unpaid' })), 'pending')
  assert.equal(resolveOrderStatus(order(), SID, session({ status: 'open', payment_status: 'unpaid' })), 'pending')
  assert.equal(resolveOrderStatus(order(), SID, null), 'pending')
})

test('expired session or cancelled order -> failed', () => {
  assert.equal(resolveOrderStatus(order(), SID, session({ status: 'expired', payment_status: 'unpaid' })), 'failed')
  assert.equal(resolveOrderStatus(order({ status: 'cancelled' }), SID, null), 'failed')
})

test('copy exists for every state and only paid claims success', () => {
  for (const k of ['checking', 'paid', 'pending', 'failed', 'unknown']) assert.ok(STATUS_COPY[k].title)
  for (const k of ['checking', 'pending', 'failed', 'unknown']) assert.doesNotMatch(STATUS_COPY[k].body + STATUS_COPY[k].title, /successful|Confirmed/)
})
