import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applicationRow, normalizeApplyEmail, ambassadorEmailExists, ambassadorCodeStatus } from '../app/lib/ambassador-apply.mjs'

function fakeDb(rows) {
  return { from: () => { const q = { f: r => true,
    select() { return q }, limit() { return Promise.resolve({ data: rows.filter(q.f), error: null }) },
    ilike(col, pat) { const v = pat.replace(/\\(.)/g, '$1').toLowerCase(); q.f = r => r[col].toLowerCase() === v; return q },
    eq(col, v) { q.f = r => r[col] === v; return q } }; return q } }
}

test('client cannot choose status, commission or code', () => {
  const { row } = applicationRow({ name: 'A', email: 'A@B.co', why: 'x', status: 'approved', commission_rate: 90, code: 'MINE' })
  assert.equal(row.status, 'pending'); assert.equal(row.commission_rate, 15)
  assert.match(row.code, /^PENDING-[0-9A-F]{12}$/); assert.equal(row.email, 'a@b.co')
  assert.ok(applicationRow({ email: 'bad', name: 'A', why: 'x' }).error)
  assert.equal(normalizeApplyEmail(' X@Y.io '), 'x@y.io')
})

test('duplicate check is case-insensitive and returns only a boolean', async () => {
  const db = fakeDb([{ id: 1, email: 'Taken@Vibin.co', status: 'pending', code: 'PENDING-1' }])
  assert.equal(await ambassadorEmailExists(db, 'taken@vibin.co'), true)
  assert.equal(await ambassadorEmailExists(db, 'new@vibin.co'), false)
})

test('code gate: placeholder codes are never valid', async () => {
  const db = fakeDb([{ code: 'JOSIAS', status: 'approved' }, { code: 'PENDING-ABC', status: 'pending' }])
  assert.equal(await ambassadorCodeStatus(db, 'josias'), 'approved')
  assert.equal(await ambassadorCodeStatus(db, 'PENDING-ABC'), 'invalid')
  assert.equal(await ambassadorCodeStatus(db, 'nope'), 'invalid')
})

test('browser pages no longer query the ambassadors table directly', () => {
  for (const f of ['app/ambassador/apply/page.js', 'app/ambassador/login/page.js'])
    assert.ok(!readFileSync(f, 'utf8').includes("from('ambassadors')"), f)
})

test('migration drops the always-true policies', () => {
  const s = readFileSync('supabase/migrations/20261023000007_ambassadors_rls_lockdown.sql', 'utf8')
  assert.match(s, /DROP POLICY IF EXISTS "Ambassadors view own"/)
  assert.match(s, /DROP POLICY IF EXISTS "Anyone can apply ambassador"/)
  assert.match(s, /auth\.jwt\(\) ->> 'email'/)
})
