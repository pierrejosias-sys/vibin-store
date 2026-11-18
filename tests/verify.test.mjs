import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeCode, normalizeTier, handleScan, handleClaim, handleRedeem } from '../app/lib/verify.mjs'

// A Supabase client stand-in: records every rpc call and answers with a canned { data, error }.
function fakeDb(reply) {
  const calls = []
  return { calls, rpc: (fn, args) => { calls.push({ fn, args }); return Promise.resolve(typeof reply === 'function' ? reply(fn, args) : reply) } }
}

const sql = readFileSync('supabase/migrations/20261118000001_vibin_verify.sql', 'utf8')

// ── code / tier normalisation ─────────────────────────────────────────────
test('normalizeCode accepts any casing / spacing / dash of a VBN code', () => {
  for (const raw of ['VBN-TCH5-2601', 'vbn-tch5-2601', ' VBN TCH5 2601 ', 'VBNTCH52601', 'vbn–tch5–2601', 'VBN‑TCH5‑2601'])
    assert.equal(normalizeCode(raw), 'VBN-TCH5-2601', raw)
})

test('normalizeCode rejects anything that is not VBN-XXXX-XXXX', () => {
  for (const raw of ['', 'VBN-TCH5-260', 'VBN-TCH5-26011', 'ABC-TCH5-2601', 'VBN-TCH5-26_1', "VBN-TCH5-2601'; drop table verify_codes;--",
    'VBN-ŦCH5-2601', 'VBN-TCHı-2601', 'x'.repeat(41), null, undefined, 42, {}, ['VBN-TCH5-2601']])
    assert.equal(normalizeCode(raw), null, String(raw))
})

test('normalizeTier is a short upper-case token; costs are never taken from the browser', () => {
  assert.equal(normalizeTier(' vibin10 '), 'VIBIN10')
  for (const raw of ['', 'abc', 'VIBIN10; DROP', 'x'.repeat(13), null, 10, {}]) assert.equal(normalizeTier(raw), null, String(raw))
})

// ── GET /api/verify/:code ─────────────────────────────────────────────────
const PIECE = { code: 'VBN-TCH5-2601', product: 'Tech Shorts', drop_name: 'Drop 01 SS26', colorway: 'Black / Gasoline Turquoise', size: 'L', points_value: 150, claimed: false, claimed_at: null }

test('scan: a registered, unclaimed code is authentic and exposes only public piece data', async () => {
  const db = fakeDb({ data: [PIECE], error: null })
  const { status, body } = await handleScan(db, ' vbn-tch5-2601 ')
  assert.equal(status, 200)
  assert.deepEqual(body, { status: 'authentic', code: 'VBN-TCH5-2601', product: 'Tech Shorts', drop: 'Drop 01 SS26', colorway: 'Black / Gasoline Turquoise', size: 'L', points_value: 150 })
  assert.deepEqual(db.calls, [{ fn: 'verify_scan', args: { p_code: 'VBN-TCH5-2601' } }])
})

test('scan: a claimed code is still genuine, reports when, and never says by whom', async () => {
  const db = fakeDb({ data: [{ ...PIECE, code: 'VBN-MDV9-2601', claimed: true, claimed_at: '2026-11-12T17:00:00+00:00', claimed_by: 'someone@example.com' }], error: null })
  const { status, body } = await handleScan(db, 'VBN-MDV9-2601')
  assert.equal(status, 200)
  assert.equal(body.status, 'claimed')
  assert.equal(body.claimed_at, '2026-11-12T17:00:00+00:00')
  assert.ok(!JSON.stringify(body).includes('someone@example.com') && !('claimed_by' in body))
})

test('scan: unregistered and malformed codes are not_found, and a malformed one never reaches the database', async () => {
  const empty = fakeDb({ data: [], error: null })
  assert.deepEqual(await handleScan(empty, 'VBN-FAKE-0000'), { status: 404, body: { status: 'not_found' } })
  assert.equal(empty.calls.length, 1)
  const never = fakeDb({ data: [PIECE], error: null })
  assert.deepEqual(await handleScan(never, 'not a code'), { status: 404, body: { status: 'not_found' } })
  assert.equal(never.calls.length, 0)
})

test('scan: a database error is raised (route answers 500), not reported as an authentic or fake piece', async () => {
  await assert.rejects(handleScan(fakeDb({ data: null, error: { message: 'boom' } }), 'VBN-TCH5-2601'), /boom/)
})

// ── POST /api/claim ───────────────────────────────────────────────────────
const CLAIMED = { o_outcome: 'claimed', o_points_awarded: 200, o_bonus: 50, o_new_balance: 200, o_claimed_at: '2026-11-18T06:00:00+00:00' }

test('claim: first claim pays points (+50 first-verify bonus included) and returns the new balance', async () => {
  const db = fakeDb({ data: [CLAIMED], error: null })
  const { status, body } = await handleClaim(db, { code: 'vbn-tch5-2601', account_or_email: '  Fan@Example.COM ' })
  assert.equal(status, 200)
  assert.deepEqual(body, { status: 'claimed', points_awarded: 200, bonus_awarded: 50, new_balance: 200, claimed_at: '2026-11-18T06:00:00+00:00' })
  assert.deepEqual(db.calls, [{ fn: 'verify_claim', args: { p_code: 'VBN-TCH5-2601', p_account: 'fan@example.com' } }])
})

test('claim: the browser cannot choose points, balance or tier; only code and email are forwarded', async () => {
  const db = fakeDb({ data: [CLAIMED], error: null })
  await handleClaim(db, { code: 'VBN-TCH5-2601', account_or_email: 'a@b.co', points: 99999, points_value: 99999, bonus: 9999, balance: 1e6 })
  assert.deepEqual(Object.keys(db.calls[0].args).sort(), ['p_account', 'p_code'])
})

test('claim: an already-claimed code is 409, returns claimed_at, and pays nothing', async () => {
  const db = fakeDb({ data: [{ o_outcome: 'already_claimed', o_points_awarded: 0, o_bonus: 0, o_new_balance: null, o_claimed_at: '2026-11-12T17:00:00+00:00' }], error: null })
  const { status, body } = await handleClaim(db, { code: 'VBN-MDV9-2601', account_or_email: 'a@b.co' })
  assert.equal(status, 409)
  assert.deepEqual(body, { status: 'already_claimed', claimed_at: '2026-11-12T17:00:00+00:00' })
})

test('claim: an unregistered code is 404 and is never created', async () => {
  const db = fakeDb({ data: [{ o_outcome: 'not_found', o_points_awarded: 0, o_bonus: 0, o_new_balance: null, o_claimed_at: null }], error: null })
  assert.deepEqual(await handleClaim(db, { code: 'VBN-FAKE-0000', account_or_email: 'a@b.co' }), { status: 404, body: { status: 'not_found' } })
  const bad = fakeDb({ data: [CLAIMED], error: null })
  assert.equal((await handleClaim(bad, { code: 'nope', account_or_email: 'a@b.co' })).status, 404)
  assert.equal(bad.calls.length, 0)
})

test('claim: no email, no points; an invalid email never reaches the database', async () => {
  for (const email of [undefined, '', 'not-an-email', 'a@b', 'a b@c.co']) {
    const db = fakeDb({ data: [CLAIMED], error: null })
    const { status } = await handleClaim(db, { code: 'VBN-TCH5-2601', account_or_email: email })
    assert.equal(status, 400, String(email))
    assert.equal(db.calls.length, 0)
  }
})

test('claim: accepts the account / email aliases, and an unknown outcome or db error is raised, never paid out', async () => {
  const db = fakeDb({ data: [CLAIMED], error: null })
  await handleClaim(db, { code: 'VBN-TCH5-2601', account: 'A@B.co' })
  await handleClaim(db, { code: 'VBN-TCH5-2601', email: 'c@d.co' })
  assert.deepEqual(db.calls.map(c => c.args.p_account), ['a@b.co', 'c@d.co'])
  await assert.rejects(handleClaim(fakeDb({ data: [{ o_outcome: 'maybe' }], error: null }), { code: 'VBN-TCH5-2601', account_or_email: 'a@b.co' }), /unexpected claim outcome/)
  await assert.rejects(handleClaim(fakeDb({ data: null, error: { message: 'boom' } }), { code: 'VBN-TCH5-2601', account_or_email: 'a@b.co' }), /boom/)
})

// ── POST /api/redeem ──────────────────────────────────────────────────────
test('redeem: success returns a single-use reward code and the new balance', async () => {
  const db = fakeDb({ data: [{ o_outcome: 'redeemed', o_reward_code: 'VIBIN10-7K3QX9M2PD', o_points_spent: 200, o_new_balance: 0, o_points_needed: 0, o_tier_label: '$10 off' }], error: null })
  const { status, body } = await handleRedeem(db, { account: 'Fan@Example.com', tier_id: 'vibin10' })
  assert.equal(status, 200)
  assert.deepEqual(body, { status: 'redeemed', reward_code: 'VIBIN10-7K3QX9M2PD', tier_id: 'VIBIN10', label: '$10 off', points_spent: 200, new_balance: 0 })
  assert.deepEqual(db.calls, [{ fn: 'verify_redeem', args: { p_account: 'fan@example.com', p_tier_id: 'VIBIN10' } }])
})

test('redeem: the browser cannot set the cost; only account and tier id are forwarded', async () => {
  const db = fakeDb({ data: [{ o_outcome: 'redeemed', o_reward_code: 'VIBIN10-X', o_points_spent: 200, o_new_balance: 0, o_tier_label: '$10 off' }], error: null })
  await handleRedeem(db, { account: 'a@b.co', tier_id: 'VIBIN10', cost: 1, points: 1, points_cost: 1, balance: 1e6 })
  assert.deepEqual(Object.keys(db.calls[0].args).sort(), ['p_account', 'p_tier_id'])
})

test('redeem: not enough points is 402 with the balance and the points needed', async () => {
  const db = fakeDb({ data: [{ o_outcome: 'insufficient_points', o_reward_code: null, o_points_spent: 0, o_new_balance: 150, o_points_needed: 200, o_tier_label: '$10 off' }], error: null })
  assert.deepEqual(await handleRedeem(db, { account: 'a@b.co', tier_id: 'VIBIN10' }), { status: 402, body: { status: 'insufficient_points', balance: 150, points_needed: 200 } })
  const none = fakeDb({ data: [{ o_outcome: 'insufficient_points', o_new_balance: null, o_points_needed: 200 }], error: null })
  assert.equal((await handleRedeem(none, { account: 'new@b.co', tier_id: 'VIBIN10' })).body.balance, 0)
})

test('redeem: unknown tier and bad email are 400; an unknown outcome or db error is raised', async () => {
  const db = fakeDb({ data: [{ o_outcome: 'invalid_tier' }], error: null })
  assert.equal((await handleRedeem(db, { account: 'a@b.co', tier_id: 'VIBIN999' })).status, 400)
  const never = fakeDb({ data: [], error: null })
  assert.equal((await handleRedeem(never, { account: 'nope', tier_id: 'VIBIN10' })).status, 400)
  assert.equal((await handleRedeem(never, { account: 'a@b.co', tier_id: '' })).status, 400)
  assert.equal(never.calls.length, 0)
  await assert.rejects(handleRedeem(fakeDb({ data: [{ o_outcome: 'maybe' }], error: null }), { account: 'a@b.co', tier_id: 'VIBIN10' }), /unexpected redeem outcome/)
  await assert.rejects(handleRedeem(fakeDb({ data: null, error: { message: 'boom' } }), { account: 'a@b.co', tier_id: 'VIBIN10' }), /boom/)
})

// ── security guards (static) ──────────────────────────────────────────────
test('the browser page holds no database access: no service key, no supabase client, no in-memory points', () => {
  const page = readFileSync('app/verify/page.js', 'utf8')
  for (const bad of ['SERVICE_ROLE', 'service_role', '@supabase', 'createClient', 'supabase.', 'DEMO_REGISTRY', 'Math.random', 'sk_', 'eyJ'])
    assert.ok(!page.includes(bad), `page.js must not contain ${bad}`)
  for (const endpoint of ["'/api/verify/'", "'/api/claim'", "'/api/redeem'"]) assert.ok(page.includes(endpoint), endpoint)
})

test('the hero <header> is reset: the site-wide `header` rule would turn it into the 64px sticky nav bar', () => {
  const page = readFileSync('app/verify/page.js', 'utf8')
  assert.match(readFileSync('app/styles.css', 'utf8'), /^header \{[^}]*position: sticky[^}]*height: 64px/m, 'premise: the global header rule exists')
  const rule = /\.verify-wrap header\.verify-hero \{([^}]*)\}/.exec(page)
  assert.ok(rule, 'page.js must override the global header rule for its hero')
  for (const decl of ['position: static', 'display: block', 'height: auto', 'background: transparent']) assert.ok(rule[1].includes(decl), decl)
})

test('only the three route handlers reach the service-role client, and they are never cached', () => {
  for (const f of ['app/api/verify/[code]/route.js', 'app/api/claim/route.js', 'app/api/redeem/route.js']) {
    const s = readFileSync(f, 'utf8')
    assert.match(s, /export const dynamic = 'force-dynamic'/, f)
    assert.match(s, /serviceClient\(\)/, f)
    assert.ok(!s.includes('SUPABASE_SERVICE_ROLE_KEY'), `${f} reads the key only through verify-server.mjs`)
  }
  assert.match(readFileSync('app/lib/verify-server.mjs', 'utf8'), /no-store/)
})

test('migration: RLS on every table with no policies, nothing granted to the browser roles', () => {
  for (const t of ['verify_reward_tiers', 'verify_codes', 'points_accounts', 'redemptions', 'points_ledger'])
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${t}\\s+ENABLE ROW LEVEL SECURITY`), t)
  assert.ok(!/CREATE POLICY/i.test(sql), 'no policies: the anon key can neither read nor write')
  assert.match(sql, /REVOKE ALL ON public\.verify_reward_tiers[\s\S]*?FROM PUBLIC, anon, authenticated/)
  const grants = sql.replace(/--.*$/gm, '').match(/\bGRANT\b[^;]*;/gi) || []
  assert.ok(grants.length >= 7, 'service_role grants are present')
  for (const g of grants) assert.match(g, /TO service_role;$/, `GRANT only to service_role: ${g}`)
  for (const sig of ['verify_scan\\(TEXT\\)', 'verify_claim\\(TEXT, TEXT\\)', 'verify_redeem\\(TEXT, TEXT\\)', 'verify_expire_lots\\(TEXT\\)', 'verify_random_code\\(INTEGER\\)']) {
    assert.match(sql, new RegExp(`REVOKE ALL ON FUNCTION public\\.${sig}\\s+FROM PUBLIC, anon, authenticated`), sig)
    assert.match(sql, new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${sig}\\s+TO service_role`), sig)
  }
})

test('migration: SECURITY DEFINER functions pin their search_path', () => {
  const headers = sql.split('CREATE OR REPLACE FUNCTION').slice(1).map(b => b.split('AS $$')[0])
  const secdef = headers.filter(h => /SECURITY DEFINER/.test(h))
  assert.equal(headers.length, 5)
  assert.equal(secdef.length, 4, 'scan, claim, redeem, expire_lots')
  for (const h of headers) assert.match(h, /SET search_path = public, pg_temp/)
})

test('migration: claim and redeem are atomic by construction', () => {
  // claim: a single conditional UPDATE is the gate; the loser matches zero rows
  assert.match(sql, /UPDATE public\.verify_codes AS v\s+SET claimed = true[\s\S]*?WHERE v\.code = v_code AND v\.claimed = false/)
  // structural backstop: one 'earn' ledger row per code, whatever the application does
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS points_ledger_one_earn_per_code ON public\.points_ledger \(code\) WHERE kind = 'earn'/)
  // redeem: the account row is locked before the balance is read; the cost comes from the tiers table
  assert.match(sql, /SELECT a\.balance INTO v_bal FROM public\.points_accounts a WHERE a\.email = v_email FOR UPDATE/)
  assert.match(sql, /FROM public\.verify_reward_tiers t WHERE t\.tier_id = upper\(btrim\(p_tier_id\)\) AND t\.active/)
  // the balance can never go negative, and a ledger that disagrees with the balance rolls everything back
  assert.match(sql, /balance\s+INTEGER NOT NULL DEFAULT 0 CHECK \(balance >= 0\)/)
  assert.match(sql, /RAISE EXCEPTION 'points ledger out of step/)
})

test('migration: demo seed matches the spec; FAKE is deliberately not registered', () => {
  assert.match(sql, /'VBN-TCH5-2601', 'Tech Shorts'[^)]*'L',\s+150, 'demo'/)
  assert.match(sql, /'VBN-HDE8-2601'/)
  assert.match(sql, /'VBN-BRF3-2601'/)
  assert.match(sql, /'VBN-MDV9-2601'[^)]*true, '2026-11-12 12:00:00-05', 'demo-seed'/)
  assert.ok(!sql.includes('VBN-FAKE-0000') || /deliberately NOT registered/.test(sql))
  assert.ok(!/INSERT INTO public\.verify_codes[^;]*VBN-FAKE-0000/.test(sql))
  assert.match(sql, /\('VIBIN10', 200,[\s\S]*\('VIBIN25', 400,[\s\S]*\('VIBIN50', 750,/)
})
