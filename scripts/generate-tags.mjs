#!/usr/bin/env node
/**
 * Vibin Apparel — seed numbered pieces + render QR tags FROM Design's master list.
 *
 * Codes are NOT generated here. They are loaded from the hang-tag CSV that Design
 * printed (default: data/drop01-hangtags.csv, columns drop,style,number,code,url),
 * so the DB always matches the physical tags. Then writes:
 *   <out>/tags.csv                             drop,style,number,code,tag,url
 *   <out>/png/<tag>.png, <out>/svg/<tag>.svg   QR codes for each tag URL
 *
 * Idempotent: pieces already in the DB with the same code are left alone; a piece
 * whose DB code differs from the CSV aborts the run (never silently overwritten).
 *
 * Usage:
 *   node scripts/generate-tags.mjs [--csv data/drop01-hangtags.csv] [--drop d01]
 *        [--styles hd,cj,wb,ns] [--out tags/d01] [--dry-run]
 *
 *   --dry-run  validate the CSV and render QR files without touching the database.
 * Env (non-dry-run): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Requires migration 20261022000001_drops_numbered_pieces.sql to be applied.
 */
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Must stay in sync with TAG_RE / parseTag in app/lib/drops.js (the /t/[tag] parser).
const TAG_RE = /^(d\d{2})-([a-z]{2,4})-(\d{3})-([a-z0-9]{4})$/

function args() {
  const a = process.argv.slice(2)
  const get = (k, d) => { const i = a.indexOf(`--${k}`); return i >= 0 && a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : d }
  const styles = get('styles', null)
  return {
    csv: get('csv', 'data/drop01-hangtags.csv'),
    drop: get('drop', null),
    styles: styles ? styles.split(',').map(s => s.trim()).filter(Boolean) : null,
    out: get('out', null),
    dryRun: a.includes('--dry-run'),
  }
}

const tagFor = (drop, style, number, code) => `${drop}-${style}-${String(number).padStart(3, '0')}-${code}`

export async function loadCsv(file) {
  const lines = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim())
  const header = lines.shift().split(',').map(h => h.trim().toLowerCase())
  const col = n => { const i = header.indexOf(n); if (i < 0) throw new Error(`${file}: missing column "${n}"`); return i }
  const [iDrop, iStyle, iNum, iCode, iUrl] = ['drop', 'style', 'number', 'code', 'url'].map(col)
  const seenCode = new Set(), seenPiece = new Set()
  return lines.map((line, idx) => {
    const c = line.split(',').map(v => v.trim())
    const row = { drop: c[iDrop].toLowerCase(), style: c[iStyle].toLowerCase(), number: parseInt(c[iNum], 10), code: c[iCode].toLowerCase(), url: c[iUrl] }
    const where = `${file}:${idx + 2}`
    const tag = tagFor(row.drop, row.style, row.number, row.code)
    const m = TAG_RE.exec(tag)
    if (!m || !(row.number >= 1 && row.number <= 50)) throw new Error(`${where}: invalid piece ${tag}`)
    if (!row.url.endsWith(`/t/${tag}`)) throw new Error(`${where}: url ${row.url} does not match ${tag}`)
    if (seenCode.has(row.code)) throw new Error(`${where}: duplicate code ${row.code}`)
    const key = `${row.drop}-${row.style}-${row.number}`
    if (seenPiece.has(key)) throw new Error(`${where}: duplicate piece ${key}`)
    seenCode.add(row.code); seenPiece.add(key)
    return { ...row, tag }
  })
}

async function seedDb(pieces) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or use --dry-run).')
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const groups = new Map()
  for (const p of pieces) {
    const k = `${p.drop}|${p.style}`
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(p)
  }
  for (const [k, rows] of groups) {
    const [drop, style] = k.split('|')
    const { data: existing, error } = await supabase.from('pieces')
      .select('number, code').eq('drop_id', drop).eq('style_code', style)
    if (error) throw new Error(`read pieces: ${error.message}`)
    const have = new Map(existing.map(p => [p.number, p.code]))
    const missing = []
    for (const p of rows) {
      if (!have.has(p.number)) missing.push({ drop_id: drop, style_code: style, number: p.number, code: p.code })
      else if (have.get(p.number) !== p.code) {
        throw new Error(`${drop}-${style} #${p.number}: DB code ${have.get(p.number)} != CSV code ${p.code}. Resolve manually; refusing to overwrite.`)
      }
    }
    if (missing.length) {
      const { error: insErr } = await supabase.from('pieces').insert(missing)
      if (insErr) throw new Error(`insert ${drop}-${style}: ${insErr.message}`)
    }
    console.log(`${drop}-${style}: ${rows.length} pieces ready (${missing.length} new)`)
  }
}

async function main() {
  const opts = args()
  let pieces = await loadCsv(opts.csv)
  if (opts.drop) pieces = pieces.filter(p => p.drop === opts.drop)
  if (opts.styles) pieces = pieces.filter(p => opts.styles.includes(p.style))
  if (!pieces.length) throw new Error('No pieces selected from CSV.')
  const drops = [...new Set(pieces.map(p => p.drop))]
  const out = opts.out || path.join('tags', drops.join('-') + (opts.dryRun ? '-dry-run' : ''))

  if (!opts.dryRun) await seedDb(pieces)

  await mkdir(path.join(out, 'png'), { recursive: true })
  await mkdir(path.join(out, 'svg'), { recursive: true })
  const rows = ['drop,style,number,code,tag,url']
  const qrOpts = { errorCorrectionLevel: 'M', margin: 2 }
  for (const p of pieces) {
    rows.push([p.drop, p.style, p.number, p.code, p.tag, p.url].join(','))
    await writeFile(path.join(out, 'png', `${p.tag}.png`), await QRCode.toBuffer(p.url, { ...qrOpts, width: 600 }))
    await writeFile(path.join(out, 'svg', `${p.tag}.svg`), await QRCode.toString(p.url, { ...qrOpts, type: 'svg' }))
  }
  await writeFile(path.join(out, 'tags.csv'), rows.join('\n') + '\n')
  console.log(`Wrote ${pieces.length} tags from ${opts.csv} to ${out}/${opts.dryRun ? ' — DRY RUN, DB not touched' : ''}`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
