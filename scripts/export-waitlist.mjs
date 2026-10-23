#!/usr/bin/env node
/**
 * Export waitlist sign-ups with their private early-access links (CSV) for Marketing.
 *   node scripts/export-waitlist.mjs [--out waitlist.csv] [--consented-only] [--base-url https://vibinapparel.com]
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * The CSV contains private links: treat it as sensitive and don't commit it.
 */
import { createClient } from '@supabase/supabase-js'
import { writeFile } from 'node:fs/promises'
import { signupsToCsv } from '../app/lib/early-access.mjs'

const a = process.argv.slice(2)
const get = (k, d) => { const i = a.indexOf(`--${k}`); return i >= 0 && a[i + 1] ? a[i + 1] : d }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1) }
const supabase = createClient(url, key, { auth: { persistSession: false } })

const rows = []
for (let from = 0; ; from += 1000) {
  let q = supabase.from('waitlist_signups').select('*').order('created_at').range(from, from + 999)
  if (a.includes('--consented-only')) q = q.eq('consent_email', true)
  const { data, error } = await q
  if (error) { console.error(error.message); process.exit(1) }
  rows.push(...data)
  if (data.length < 1000) break
}
const out = get('out', 'waitlist-export.csv')
await writeFile(out, signupsToCsv(rows, get('base-url', 'https://vibinapparel.com')))
console.log(`Wrote ${rows.length} sign-ups to ${out}`)
