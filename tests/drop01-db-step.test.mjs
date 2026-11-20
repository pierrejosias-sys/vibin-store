// Separate DB step (needs its own yes): 20261120190000_drop01_tee_snapback_numbered_SEPARATE_DB_STEP.sql.
// Static checks only; the SQL itself was exercised on a scratch PGlite DB (see vibin-store-audit note).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const MIGRATION = 'supabase/migrations/20261120190000_drop01_tee_snapback_numbered_SEPARATE_DB_STEP.sql'

test('separate DB step: seeds 50 per style, hard cap kept, refund/reserve rules, never applied by code', () => {
  const sql = read(MIGRATION)
  assert.match(sql, /SEPARATE DB STEP/)
  assert.match(sql, /FOREACH st IN ARRAY ARRAY\['te', 'sb'\]/)
  assert.match(sql, /FOR n IN 1\.\.50 LOOP/)
  assert.match(sql, /'available', 'held', 'sold', 'withheld', 'reserved', 'retired'/)
  assert.match(sql, /status = 'retired'[\s\S]*marked IS DISTINCT FROM FALSE/)   // marked or unknown -> retired
  assert.match(sql, /CREATE TRIGGER pieces_guard/)
  assert.match(sql, /SELECT public\.set_style_reserve\('d01', 'te', 0\);/)
  assert.match(sql, /SELECT public\.set_style_reserve\('d01', 'sb', 0\);/)
  assert.match(sql, /style_code = 'hd' AND status IN \('available', 'held'\)/)
  assert.doesNotMatch(sql, /DROP CONSTRAINT[^;]*number|number BETWEEN 1 AND (?!50)/)
  // The original 1–50 number check and per-style uniqueness stay in place.
  const base = read('supabase/migrations/20261022000001_drops_numbered_pieces.sql')
  assert.match(base, /number\s+INTEGER NOT NULL CHECK \(number BETWEEN 1 AND 50\)/)
  assert.match(base, /UNIQUE \(drop_id, style_code, number\)/)
})

