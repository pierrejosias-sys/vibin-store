import test from 'node:test'
import assert from 'node:assert/strict'
import { accessPhase, canPreorder, newEarlyAccessToken, isWellFormedToken, earlyAccessLink, normalizeEmail, signupsToCsv } from '../app/lib/early-access.mjs'
import { contactPayload, syncSignupToBrevo } from '../app/lib/brevo.mjs'
import { markEarlyAccessTokenUsed } from '../app/lib/waitlist.mjs'

const D = { earlyAccessAt: '2026-11-12T23:00:00Z', releaseAt: '2026-11-13T00:00:00Z', closesAt: '2026-11-16T04:59:59Z' }
const at = iso => Date.parse(iso)

test('early-access window phases', () => {
  assert.equal(accessPhase(D, at('2026-11-12T22:59:59Z')), 'upcoming')
  assert.equal(accessPhase(D, at('2026-11-12T23:00:00Z')), 'early')
  assert.equal(accessPhase(D, at('2026-11-12T23:59:59Z')), 'early')
  assert.equal(accessPhase(D, at('2026-11-13T00:00:00Z')), 'open')
  assert.equal(accessPhase(D, at('2026-11-16T05:00:00Z')), 'closed')
  assert.equal(accessPhase({ ...D, earlyAccessAt: null }, at('2026-11-12T23:30:00Z')), 'upcoming')
})

test('who can pre-order', () => {
  assert.equal(canPreorder('upcoming', true), false)
  assert.equal(canPreorder('early', true), true)
  assert.equal(canPreorder('early', false), false)
  assert.equal(canPreorder('open', false), true)
  assert.equal(canPreorder('closed', true), false)
})

test('tokens and links', () => {
  const t = newEarlyAccessToken()
  assert.ok(isWellFormedToken(t)); assert.notEqual(t, newEarlyAccessToken())
  assert.equal(isWellFormedToken('short'), false); assert.equal(isWellFormedToken("x'; drop table--aaaaaaaaaaaa"), false)
  assert.equal(earlyAccessLink('abc_DEF-123456789012345'), 'https://vibinapparel.com/drop/01?access=abc_DEF-123456789012345')
})

test('email normalization + CSV (formula-safe)', () => {
  assert.equal(normalizeEmail('  A@B.co '), 'a@b.co'); assert.equal(normalizeEmail('nope'), null)
  const csv = signupsToCsv([{ email: 'a@b.co', first_name: '=HYPERLINK("x")', sources: ['d01-waitlist'], styles: [], consent_email: true, early_access_token: 'tok_tok_tok_tok_tok_tok', created_at: 'c', synced_at: null }])
  assert.match(csv, /^email,first_name,/)
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/)
  assert.match(csv, /drop\/01\?access=tok_tok_tok_tok_tok_tok/)
})

test('brevo payload', () => {
  assert.deepEqual(contactPayload({ email: 'a@b.co', earlyAccessLink: 'L', source: 'd01-waitlist' }, 7), {
    email: 'a@b.co', attributes: { EARLY_ACCESS_LINK: 'L', SOURCE: 'd01-waitlist' }, listIds: [7], updateEnabled: true,
  })
})

test('brevo sync: no-op without env, success/failure, api-key header', async () => {
  assert.deepEqual(await syncSignupToBrevo({ email: 'a@b.co' }, { env: {} }), { skipped: true })
  assert.deepEqual(await syncSignupToBrevo({ email: 'a@b.co' }, { env: { BREVO_API_KEY: 'k' } }), { skipped: true })
  const env = { BREVO_API_KEY: 'xkeysib-1', BREVO_WAITLIST_LIST_ID: '7' }
  const calls = []
  const ok = async (u, o) => { calls.push([u, o]); return { ok: true, status: 204 } }
  assert.deepEqual(await syncSignupToBrevo({ email: 'a@b.co', earlyAccessLink: 'L', source: 's' }, { env, fetchImpl: ok }), { ok: true })
  assert.equal(calls[0][0], 'https://api.brevo.com/v3/contacts')
  assert.equal(calls[0][1].headers['api-key'], 'xkeysib-1')
  assert.deepEqual(JSON.parse(calls[0][1].body).listIds, [7])
  const bad = async () => ({ ok: false, status: 400, json: async () => ({ code: 'invalid_parameter' }) })
  assert.deepEqual(await syncSignupToBrevo({ email: 'a@b.co' }, { env, fetchImpl: bad }), { ok: false, error: 'brevo 400 invalid_parameter' })
  const boom = async () => { throw new Error('net') }
  assert.equal((await syncSignupToBrevo({ email: 'a@b.co' }, { env, fetchImpl: boom })).ok, false)
})

test('token is marked used once (first session wins)', async () => {
  const row = { early_access_token: 'tok_tok_tok_tok_tok_tok', token_used_at: null, token_used_session_id: null }
  const supabase = { from: () => {
    let patch; const f = []
    const q = {
      update(p) { patch = p; return q },
      eq(k, v) { f.push(r => r[k] === v); return q },
      is(k, v) { f.push(r => (r[k] ?? null) === v); return q },
      select() { const m = f.every(fn => fn(row)); if (m) Object.assign(row, patch); return Promise.resolve({ data: m ? [{ id: 1 }] : [], error: null }) },
    }
    return q
  } }
  assert.equal(await markEarlyAccessTokenUsed(supabase, row.early_access_token, 'cs_1'), true)
  assert.equal(await markEarlyAccessTokenUsed(supabase, row.early_access_token, 'cs_2'), false)
  assert.equal(row.token_used_session_id, 'cs_1')
  assert.equal(await markEarlyAccessTokenUsed(supabase, 'bad', 'cs_3'), false)
})
