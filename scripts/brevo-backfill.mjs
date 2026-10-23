#!/usr/bin/env node
/**
 * Sync consented, not-yet-synced waitlist sign-ups to Brevo (contacts + waitlist list).
 *   node scripts/brevo-backfill.mjs [--limit 500] [--dry-run]
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BREVO_API_KEY, BREVO_WAITLIST_LIST_ID
 * synced_at is set only on success; failures keep sync_error and are retried next run.
 */
import { createClient } from '@supabase/supabase-js'
import { brevoConfig } from '../app/lib/brevo.mjs'
import { syncRow } from '../app/lib/waitlist.mjs'

const a = process.argv.slice(2)
const li = a.indexOf('--limit')
const limit = (li >= 0 && parseInt(a[li + 1], 10)) || 500
const dry = a.includes('--dry-run')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1) }
if (!dry && !brevoConfig()) { console.error('Set BREVO_API_KEY and BREVO_WAITLIST_LIST_ID (or use --dry-run).'); process.exit(1) }
const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: rows, error } = await supabase.from('waitlist_signups').select('*')
  .is('synced_at', null).eq('consent_email', true).order('created_at').limit(limit)
if (error) { console.error(error.message); process.exit(1) }
console.log(`${rows.length} unsynced consented sign-ups${dry ? ' (dry run)' : ''}`)
if (dry) process.exit(0)

let ok = 0, failed = 0
for (const row of rows) {
  const res = await syncRow(supabase, row)
  if (res.ok) ok++; else { failed++; console.warn(`${row.email}: ${res.error}`) }
  await new Promise(r => setTimeout(r, 150)) // gentle on Brevo rate limits
}
console.log(`Synced ${ok}, failed ${failed}`)
process.exit(failed ? 2 : 0)
