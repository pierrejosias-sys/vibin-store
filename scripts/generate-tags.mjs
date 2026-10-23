#!/usr/bin/env node
/**
 * Vibin Apparel — generate numbered pieces + QR tags for a drop.
 *
 * Seeds 1..50 numbered pieces per style (size is assigned at sale), each with a
 * unique random 4-char code, then writes:
 *   <out>/tags.csv                     drop,style,number,code,tag,url
 *   <out>/png/<tag>.png, <out>/svg/<tag>.svg   QR codes for each tag URL
 *
 * Idempotent: existing pieces keep their codes; only missing numbers are created.
 *
 * Usage:
 *   node scripts/generate-tags.mjs --drop d01 [--styles hd,cj,wb,ns,tee] [--count 50]
 *        [--base-url https://vibinapparel.com] [--out tags/d01] [--dry-run]
 *
 *   --dry-run  generate codes locally without touching the database (preview only;
 *              these codes will NOT match the DB).
 * Env (non-dry-run): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Requires migration 20261022000001_drops_numbered_pieces.sql to be applied.
 */
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { randomInt } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_STYLES = ['hd', 'cj', 'wb', 'ns', 'tee']
// No 0/o/1/l/i to keep printed codes unambiguous.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

function args() {
  const a = process.argv.slice(2)
  const get = (k, d) => { const i = a.indexOf(`--${k}`); return i >= 0 && a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : d }
  return {
    drop: get('drop', 'd01'),
    styles: get('styles', DEFAULT_STYLES.join(',')).split(',').map(s => s.trim()).filter(Boolean),
    count: parseInt(get('count', '50'), 10),
    baseUrl: get('base-url', 'https://vibinapparel.com').replace(/\/$/, ''),
    out: get('out', null),
    dryRun: a.includes('--dry-run'),
  }
}

const randomCode = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
const tagFor = (drop, style, number, code) => `${drop}-${style}-${String(number).padStart(3, '0')}-${code}`

async function seedDb(opts) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or use --dry-run).')
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const pieces = []
  for (const style of opts.styles) {
    const { data: existing, error } = await supabase.from('pieces')
      .select('number, code').eq('drop_id', opts.drop).eq('style_code', style)
    if (error) throw new Error(`read pieces: ${error.message}`)
    const have = new Map(existing.map(p => [p.number, p.code]))
    for (let n = 1; n <= opts.count; n++) {
      let attempts = 0
      while (!have.has(n)) {
        const code = randomCode()
        const { error: insErr } = await supabase.from('pieces')
          .insert({ drop_id: opts.drop, style_code: style, number: n, code })
        if (!insErr) { have.set(n, code); break }
        if (insErr.code !== '23505' || ++attempts > 20) throw new Error(`insert ${style} #${n}: ${insErr.message}`)
        // 23505: code collision (retry) or number created concurrently (re-read)
        const { data: row } = await supabase.from('pieces').select('code')
          .eq('drop_id', opts.drop).eq('style_code', style).eq('number', n).maybeSingle()
        if (row) have.set(n, row.code)
      }
      pieces.push({ style, number: n, code: have.get(n) })
    }
    console.log(`${style}: ${opts.count} pieces ready (${opts.count - existing.filter(p => p.number <= opts.count).length} new)`)
  }
  return pieces
}

function seedLocal(opts) {
  const used = new Set()
  const pieces = []
  for (const style of opts.styles) {
    for (let n = 1; n <= opts.count; n++) {
      let code
      do { code = randomCode() } while (used.has(code))
      used.add(code)
      pieces.push({ style, number: n, code })
    }
  }
  return pieces
}

async function main() {
  const opts = args()
  if (!/^d\d{2}$/.test(opts.drop)) throw new Error('--drop must look like d01')
  if (!(opts.count >= 1 && opts.count <= 50)) throw new Error('--count must be 1..50')
  for (const s of opts.styles) if (!/^[a-z]{2,4}$/.test(s)) throw new Error(`bad style code: ${s}`)
  const out = opts.out || path.join('tags', opts.dryRun ? `${opts.drop}-dry-run` : opts.drop)

  const pieces = opts.dryRun ? seedLocal(opts) : await seedDb(opts)

  await mkdir(path.join(out, 'png'), { recursive: true })
  await mkdir(path.join(out, 'svg'), { recursive: true })
  const rows = ['drop,style,number,code,tag,url']
  for (const p of pieces) {
    const tag = tagFor(opts.drop, p.style, p.number, p.code)
    const url = `${opts.baseUrl}/t/${tag}`
    rows.push([opts.drop, p.style, p.number, p.code, tag, url].join(','))
    const qrOpts = { errorCorrectionLevel: 'M', margin: 2 }
    await writeFile(path.join(out, 'png', `${tag}.png`), await QRCode.toBuffer(url, { ...qrOpts, width: 600 }))
    await writeFile(path.join(out, 'svg', `${tag}.svg`), await QRCode.toString(url, { ...qrOpts, type: 'svg' }))
  }
  await writeFile(path.join(out, 'tags.csv'), rows.join('\n') + '\n')
  console.log(`Wrote ${pieces.length} tags to ${out}/ (tags.csv, png/, svg/)${opts.dryRun ? ' — DRY RUN, not in DB' : ''}`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
