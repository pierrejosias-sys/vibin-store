import test from 'node:test'
import assert from 'node:assert/strict'
import { dropStatus, shortOpenLabel, LOADING_STATUS } from '../app/lib/drop-status.mjs'
import { DROPS } from '../app/lib/drops.js'

const W = { releaseAt: '2026-11-13T00:00:00Z', earlyAccessAt: '2026-11-12T23:00:00Z', closesAt: null }
const t = iso => Date.parse(iso)

test('label reads "Nov 12, 7 PM ET" for the Drop 01 open time', () => {
  assert.equal(shortOpenLabel(W.releaseAt), 'Nov 12, 7 PM ET')
  assert.equal(shortOpenLabel('2026-11-13T00:30:00Z'), 'Nov 12, 7:30 PM ET')
  assert.equal(shortOpenLabel(null), '')
})

test('before the window: no "live" copy, add-to-bag disabled with a clear label', () => {
  const s = dropStatus(W, t('2026-10-23T14:00:00Z'))
  assert.equal(s.phase, 'upcoming')
  assert.equal(s.live, false)
  assert.equal(s.canAdd, false)
  assert.equal(s.promo, 'Drops Nov 12, 7 PM ET')
  assert.equal(s.atcLabel, 'Drops Nov 12, 7 PM ET')
  assert.doesNotMatch(s.promo + s.metaLine, /live/i)
})

test('early hour: only waitlist-cookie holders can add', () => {
  const now = t('2026-11-12T23:30:00Z')
  const anon = dropStatus(W, now, false)
  assert.equal(anon.phase, 'early'); assert.equal(anon.canAdd, false)
  assert.match(anon.atcLabel, /early access only/i)
  assert.doesNotMatch(anon.promo, /live/i)
  const vip = dropStatus(W, now, true)
  assert.equal(vip.canAdd, true); assert.equal(vip.atcLabel, null)
})

test('after open: current behavior ("now live", add enabled)', () => {
  const s = dropStatus(W, t('2026-11-13T00:00:00Z'))
  assert.equal(s.phase, 'open'); assert.equal(s.live, true); assert.equal(s.canAdd, true)
  assert.equal(s.atcLabel, null)
  assert.match(s.metaLine, /now live/)
})

test('closed and TBA windows never say live or allow add', () => {
  const closed = dropStatus({ ...W, closesAt: '2026-11-20T00:00:00Z' }, t('2026-11-21T00:00:00Z'))
  assert.equal(closed.phase, 'closed'); assert.equal(closed.canAdd, false); assert.equal(closed.live, false)
  const tba = dropStatus({ releaseAt: null }, Date.now())
  assert.equal(tba.phase, 'tba'); assert.equal(tba.canAdd, false)
})

test('loading default is safe', () => {
  assert.equal(LOADING_STATUS.live, false); assert.equal(LOADING_STATUS.canAdd, false)
})

test('uses the same Drop 01 config as checkout', () => {
  assert.equal(DROPS.d01.earlyAccessAt, W.earlyAccessAt)
})
