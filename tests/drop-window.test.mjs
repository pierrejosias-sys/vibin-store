import test from 'node:test'
import assert from 'node:assert/strict'
import { dropPhase, countdownTarget, formatET, serverNow } from '../app/lib/drop-window.mjs'

const OPEN = '2026-11-13T00:00:00Z'   // Thu Nov 12, 2026 7:00 PM ET
const CLOSE = '2026-11-16T04:59:59Z'  // Sun Nov 15, 2026 11:59:59 PM ET

test('phases around the Drop 01 window', () => {
  assert.equal(dropPhase(null, CLOSE, Date.parse('2026-11-14T00:00:00Z')), 'tba')
  assert.equal(dropPhase(OPEN, CLOSE, Date.parse('2026-10-23T05:00:00Z')), 'upcoming')
  assert.equal(dropPhase(OPEN, CLOSE, Date.parse(OPEN) - 1), 'upcoming')
  assert.equal(dropPhase(OPEN, CLOSE, Date.parse(OPEN)), 'open')
  assert.equal(dropPhase(OPEN, CLOSE, Date.parse('2026-11-14T12:00:00Z')), 'open')
  assert.equal(dropPhase(OPEN, CLOSE, Date.parse(CLOSE)), 'open')
  assert.equal(dropPhase(OPEN, CLOSE, Date.parse(CLOSE) + 1), 'closed')
  assert.equal(dropPhase(OPEN, null, Date.parse('2030-01-01T00:00:00Z')), 'open')
})

test('window length matches the approved open/close times (76h 59m 59s)', () => {
  // Note: Thu 7:00 PM -> Sun 11:59 PM ET is ~77h, not exactly 72h; the approved times win.
  assert.equal(Date.parse(CLOSE) - Date.parse(OPEN), (77 * 3600 - 1) * 1000)
})

test('countdown targets', () => {
  assert.equal(countdownTarget('upcoming', OPEN, CLOSE), OPEN)
  assert.equal(countdownTarget('open', OPEN, CLOSE), CLOSE)
  assert.equal(countdownTarget('closed', OPEN, CLOSE), null)
})

test('times render in ET (after DST ends)', () => {
  assert.equal(formatET(OPEN), 'Thu, Nov 12, 7:00 PM ET')
  assert.equal(formatET(CLOSE), 'Sun, Nov 15, 11:59 PM ET')
})

test('now override is ignored in production', () => {
  const o = '2026-11-14T00:00:00Z'
  assert.equal(serverNow({ DROP_NOW_OVERRIDE: o, VERCEL_ENV: 'preview' }), Date.parse(o))
  assert.notEqual(serverNow({ DROP_NOW_OVERRIDE: o, VERCEL_ENV: 'production' }), Date.parse(o))
  assert.notEqual(serverNow({ DROP_NOW_OVERRIDE: 'garbage' }), NaN)
})
