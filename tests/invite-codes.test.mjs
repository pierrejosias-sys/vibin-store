import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeInviteCode, validateInviteCode, recordInviteCodeUse, inviteCodeError } from '../app/lib/invite-codes.mjs'

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

/** Minimal fake for the two Supabase calls the lib makes. */
function fakeDb(rows, { throwOnSelect = null, errorOnSelect = null } = {}) {
  const calls = []
  return {
    calls,
    from(table) {
      const tableRows = rows[table] || []
      let eqCol, eqVal
      const q = {
        select() { return q },
        eq(col, val) { eqCol = col; eqVal = val; return q },
        async maybeSingle() {
          calls.push({ op: 'select', table, eq: [eqCol, eqVal] })
          if (throwOnSelect) throw new Error(throwOnSelect)
          if (errorOnSelect) return { data: null, error: { message: errorOnSelect } }
          const found = tableRows.find(r => r[eqCol] === eqVal)
          return { data: found || null, error: null }
        },
        update(patch) {
          return {
            eq(col, val) {
              calls.push({ op: 'update', table, patch, eq: [col, val] })
              const row = tableRows.find(r => r[col] === val)
              if (row) Object.assign(row, patch)
              return Promise.resolve({ data: null, error: null })
            },
          }
        },
      }
      return q
    },
  }
}

const ROWS = {
  ambassador_invite_codes: [
    { code: 'NOVA', slot: 'Ambassador 1', status: 'active', expires_at: null, uses: 0 },
    { code: 'COMET', slot: 'Ambassador 2', status: 'revoked', expires_at: null, uses: 3 },
    { code: 'ORBIT', slot: 'Ambassador 3', status: 'active', expires_at: '2020-01-01T00:00:00.000Z', uses: 1 },
  ],
}

test('normalizeInviteCode upper-cases words, rejects everything else', () => {
  assert.equal(normalizeInviteCode('nova'), 'NOVA')
  assert.equal(normalizeInviteCode('  comet '), 'COMET')
  assert.equal(normalizeInviteCode('Zenith'), 'ZENITH')
  assert.equal(normalizeInviteCode('VBN-ABCD-1234'), null)
  assert.equal(normalizeInviteCode('NOVA!'), null)
  assert.equal(normalizeInviteCode('NOVA1'), null)
  assert.equal(normalizeInviteCode('AB'), null)
  assert.equal(normalizeInviteCode(''), null)
  assert.equal(normalizeInviteCode(123), null)
})

test('validateInviteCode accepts an active code, rejects the rest', async () => {
  const db = fakeDb(ROWS)
  assert.deepEqual(await validateInviteCode(db, 'nova'), { ok: true, code: 'NOVA', slot: 'Ambassador 1' })
  assert.deepEqual(await validateInviteCode(db, 'NOPE'), { ok: false, reason: 'invalid' })
  assert.deepEqual(await validateInviteCode(db, 'VBN-ABCD-1234'), { ok: false, reason: 'invalid' })
  assert.deepEqual(await validateInviteCode(db, 'COMET'), { ok: false, reason: 'revoked' })
  assert.deepEqual(await validateInviteCode(db, 'ORBIT'), { ok: false, reason: 'expired' })
})

test('validateInviteCode never treats a DB failure as valid', async () => {
  assert.deepEqual(
    await validateInviteCode(fakeDb(ROWS, { throwOnSelect: 'boom' }), 'NOVA'),
    { ok: false, reason: 'unavailable' },
  )
  assert.deepEqual(
    await validateInviteCode(fakeDb(ROWS, { errorOnSelect: 'relation missing' }), 'NOVA'),
    { ok: false, reason: 'unavailable' },
  )
})

test('recordInviteCodeUse counts a use and stamps it; missing code is a no-op', async () => {
  const rows = { ambassador_invite_codes: [{ code: 'NOVA', uses: 2, last_used_at: null }] }
  const db = fakeDb(rows)
  await recordInviteCodeUse(db, 'NOVA')
  assert.equal(rows.ambassador_invite_codes[0].uses, 3)
  assert.ok(rows.ambassador_invite_codes[0].last_used_at)
  await recordInviteCodeUse(db, 'NOPE') // no throw, no write
  assert.equal(db.calls.filter(c => c.op === 'update').length, 1)
})

test('inviteCodeError says plainly what went wrong', () => {
  assert.match(inviteCodeError('invalid'), /isn\u2019t valid/)
  assert.match(inviteCodeError('revoked'), /revoked/)
  assert.match(inviteCodeError('expired'), /expired/)
  assert.match(inviteCodeError('unavailable'), /temporarily unavailable/)
})

test('migration seeds the 5 launch codes', () => {
  const sql = read('supabase/migrations/20261124000001_ambassador_invite_codes.sql')
  for (const code of ['NOVA', 'COMET', 'ORBIT', 'ZENITH', 'LUMEN']) assert.ok(sql.includes(`'${code}'`), `missing ${code}`)
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.ambassador_invite_codes/)
  assert.match(sql, /ADD COLUMN IF NOT EXISTS ambassador_code/)
})

test('waitlist route validates the code before sign-up and records it', () => {
  const src = read('app/api/waitlist/route.js')
  assert.match(src, /validateInviteCode\(supabase, inviteCode\)/)
  assert.match(src, /inviteCodeError\(check\.reason\)/)
  assert.match(src, /ambassadorCode/)
  assert.match(src, /recordInviteCodeUse\(supabase, ambassadorCode\)/)
})

test('join forms take an invite code from ?invite= and send it', () => {
  const drop = read('app/drop/DropClient.js')
  assert.match(drop, /get\('invite'\)/)
  assert.match(drop, /inviteCode/)
  assert.match(drop, /validate-invite/)
  const home = read('app/components/HomeNewsletter.js')
  assert.match(home, /get\('invite'\)/)
  assert.match(home, /inviteCode/)
})

test('Brevo sync carries the ambassador code', () => {
  const src = read('app/lib/brevo.mjs')
  assert.match(src, /AMBASSADOR_CODE/)
})
