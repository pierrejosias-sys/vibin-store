import test from 'node:test'
import assert from 'node:assert/strict'
import {
  lockEarlyAccessToken, attachEarlyAccessLock, releaseEarlyAccessLock, markEarlyAccessTokenUsed,
  EARLY_LOCK_TTL_MS, signupResponse, linkEmailDue, maybeSendLinkEmail,
} from '../app/lib/waitlist.mjs'
import { linkEmailPayload, sendLinkEmail } from '../app/lib/brevo.mjs'
import { enforceDropCatalog } from '../app/lib/drop-catalog.mjs'

const TOKEN = 'tok_tok_tok_tok_tok_tok'

/** Minimal single-table fake: update().eq().is().or().select() applied atomically to matching rows. */
function fakeDb(rows) {
  const parseOr = expr => expr.split(',').map(c => {
    const [col, op, ...rest] = c.split('.'); const val = rest.join('.')
    if (op === 'is') return r => (r[col] ?? null) === null
    if (op === 'lt') return r => r[col] != null && new Date(r[col]).getTime() < new Date(val).getTime()
    throw new Error(op)
  })
  return {
    rows,
    from() {
      let patch = null; const f = []
      const run = () => {
        const hit = rows.filter(r => f.every(fn => fn(r)))
        if (patch) hit.forEach(r => Object.assign(r, patch))
        return Promise.resolve({ data: hit.map(r => ({ id: r.id })), error: null })
      }
      const q = {
        update(p) { patch = p; return q },
        eq(k, v) { f.push(r => r[k] === v); return q },
        is(k, v) { f.push(r => (r[k] ?? null) === v); return q },
        or(expr) { const ors = parseOr(expr); f.push(r => ors.some(fn => fn(r))); return q },
        select() { return run() },
        then(res, rej) { return run().then(res, rej) },
      }
      return q
    },
  }
}
const row = extra => ({ id: 1, email: 'a@b.co', early_access_token: TOKEN, token_used_at: null, locked_at: null, locked_session_id: null, last_link_email_at: null, ...extra })

test('lock: only one concurrent checkout can lock a link', async () => {
  const db = fakeDb([row()])
  const now = Date.parse('2026-11-12T23:05:00Z')
  const [a, b] = await Promise.all([lockEarlyAccessToken(db, TOKEN, now), lockEarlyAccessToken(db, TOKEN, now)])
  assert.deepEqual([a, b].sort(), [false, true])
  await attachEarlyAccessLock(db, TOKEN, 'cs_1')
  assert.equal(db.rows[0].locked_session_id, 'cs_1')
  assert.equal(await lockEarlyAccessToken(db, TOKEN, now + 60_000), false)
})

test('lock: stale lock (> TTL) counts as released', async () => {
  const now = Date.parse('2026-11-12T23:50:00Z')
  const db = fakeDb([row({ locked_at: new Date(now - EARLY_LOCK_TTL_MS - 1000).toISOString(), locked_session_id: 'cs_old' })])
  assert.equal(await lockEarlyAccessToken(db, TOKEN, now), true)
  assert.equal(db.rows[0].locked_session_id, null)
})

test('lock: session expired releases; other sessions cannot release it', async () => {
  const db = fakeDb([row({ locked_at: new Date().toISOString(), locked_session_id: 'cs_1' })])
  assert.equal(await releaseEarlyAccessLock(db, TOKEN, 'cs_other'), false)
  assert.equal(await releaseEarlyAccessLock(db, TOKEN, 'cs_1'), true)
  assert.equal(db.rows[0].locked_at, null)
  assert.equal(await lockEarlyAccessToken(db, TOKEN, Date.now()), true)
})

test('used link can never be locked again; completed clears the lock', async () => {
  const db = fakeDb([row({ locked_at: new Date().toISOString(), locked_session_id: 'cs_1' })])
  assert.equal(await markEarlyAccessTokenUsed(db, TOKEN, 'cs_1'), true)
  assert.equal(db.rows[0].locked_at, null)
  assert.equal(await lockEarlyAccessToken(db, TOKEN, Date.now() + 2 * EARLY_LOCK_TTL_MS), false)
  assert.equal(await lockEarlyAccessToken(db, 'not a token', Date.now()), false)
})

test('signup response: link only for NEW rows', () => {
  const r = row()
  const created = signupResponse({ created: true, row: r })
  assert.equal(created.created, true)
  assert.equal(created.earlyAccessLink, `https://vibinapparel.com/drop/01?access=${TOKEN}`)
  const existing = signupResponse({ created: false, row: r })
  assert.deepEqual(existing, { ok: true, created: false })
  assert.ok(!JSON.stringify(existing).includes(TOKEN))
})

test('re-signup link email: skip without key, 1 per 24h, atomic, single recipient', async () => {
  const now = Date.parse('2026-10-24T12:00:00Z')
  const calls = []
  const fetchImpl = async (u, o) => { calls.push([u, JSON.parse(o.body)]); return { ok: true, status: 201 } }
  const env = { BREVO_API_KEY: 'xkeysib-1', BREVO_SENDER_EMAIL: 'hello@vibinapparel.com' }

  assert.deepEqual(await maybeSendLinkEmail(fakeDb([row()]), row(), { now, env: {}, fetchImpl }), { skipped: 'not configured' })

  const db = fakeDb([row()])
  const [a, b] = await Promise.all([
    maybeSendLinkEmail(db, row(), { now, env, fetchImpl }),
    maybeSendLinkEmail(db, row(), { now, env, fetchImpl }),
  ])
  assert.equal([a, b].filter(x => x.ok).length, 1)
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], 'https://api.brevo.com/v3/smtp/email')
  assert.deepEqual(calls[0][1].to, [{ email: 'a@b.co' }])
  assert.equal(calls[0][1].sender.email, 'hello@vibinapparel.com')

  const later = { ...db.rows[0] }
  assert.equal(linkEmailDue(later, now + 23 * 3600e3), false)
  assert.deepEqual(await maybeSendLinkEmail(db, later, { now: now + 23 * 3600e3, env, fetchImpl }), { skipped: 'rate-limited' })
  assert.equal(linkEmailDue(later, now + 24 * 3600e3), true)
  assert.equal((await maybeSendLinkEmail(db, later, { now: now + 24 * 3600e3 + 1, env, fetchImpl })).ok, true)
  assert.equal(calls.length, 2)
})

test('failed send gives the 24h slot back', async () => {
  const db = fakeDb([row()])
  const bad = async () => ({ ok: false, status: 500 })
  const r = await maybeSendLinkEmail(db, row(), { now: Date.now(), env: { BREVO_API_KEY: 'k' }, fetchImpl: bad })
  assert.equal(r.ok, false)
  assert.equal(db.rows[0].last_link_email_at, null)
})

test('link email payload + no-op without key', async () => {
  const p = linkEmailPayload({ email: 'a@b.co', link: 'L' })
  assert.equal(p.sender.email, 'hello@vibinapparel.com')
  assert.match(p.textContent, /6:00–7:00 PM ET/)
  assert.deepEqual(await sendLinkEmail({ email: 'a@b.co', link: 'L' }, { env: {} }), { skipped: true })
})

test('early-access hour: tee/snapback need a granted link', () => {
  const drops = [{ id: 'd01', name: 'Drop 01', release_at: '2026-11-13T00:00:00Z', closes_at: '2026-11-16T04:59:59Z' }]
  const now = Date.parse('2026-11-12T23:30:00Z')
  const tee = () => ({ id: 1, slug: 'vibin-classic-tee', size: 'M', qty: 1 })
  const ea = { d01: '2026-11-12T23:00:00Z' }
  assert.equal(enforceDropCatalog([tee()], drops, { now, earlyAccessAt: ea }).status, 409)
  assert.equal(enforceDropCatalog([tee()], drops, { now, earlyAccessAt: ea, earlyAccessGranted: true }).error, undefined)
  assert.equal(enforceDropCatalog([tee()], drops, { now: Date.parse('2026-11-12T22:30:00Z'), earlyAccessAt: ea, earlyAccessGranted: true }).status, 409)
})
