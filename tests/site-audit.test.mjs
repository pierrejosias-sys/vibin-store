import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { matchesFilter, categoryCounts, piecesLabel } from '../app/lib/shop-filter.mjs'
import { unsubscribeFromBrevo } from '../app/lib/brevo.mjs'

// Snapshot of the live products table (Oct 23 2026).
const PRODUCTS = [
  { slug: 'vibin-classic-tee', name: 'Foundation Tee', category: 'tops' },
  { slug: 'vibin-oversized-hoodie', name: 'Vibin Oversized Hoodie', category: 'tops' },
  { slug: 'vibin-cargo-shorts', name: 'Vibin Cargo Shorts', category: 'bottoms' },
  { slug: 'vibin-joggers', name: 'Vibin Joggers', category: 'bottoms' },
  { slug: 'vibin-snapback', name: 'Snapback', category: 'accessories' },
  { slug: 'vibin-tote-bag', name: 'Vibin Tote Bag', category: 'accessories' },
  { slug: 'vibin-zip-up-hoodie', name: 'Vibin Zip-Up Hoodie', category: 'tops' },
  { slug: 'tech-short', name: 'Tech Short', category: 'bottoms' },
  { slug: 'lanyard', name: 'Vibin Lanyard', category: 'accessories' },
]

test('homepage category counts come from the same filter as /shop', () => {
  assert.deepEqual(categoryCounts(PRODUCTS), { tees: 1, hoodies: 2, bottoms: 3, accessories: 3 })
  assert.equal(PRODUCTS.filter(p => matchesFilter(p, 'all')).length, 9)
  assert.equal(piecesLabel(1), '1 Piece'); assert.equal(piecesLabel(3), '3 Pieces')
})

const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p] })
const appFiles = walk('app').filter(f => /\.(js|mjs)$/.test(f))

test('no Mailchimp left; no Miami; no hardcoded Drop 02 countdown', () => {
  for (const f of appFiles) {
    const s = readFileSync(f, 'utf8')
    assert.ok(!/mailchimp/i.test(s) || f.includes('unsubscribe'), f)
    assert.ok(!/Miami/.test(s.replace(/\/\*.*?\*\//g, '')), f)
  }
  assert.ok(!existsSync('app/api/mailchimp'))
  assert.ok(!readFileSync('app/page.js', 'utf8').includes('DROP02_TARGET'))
})

test('no dead href="#" on public pages (careers socials)', () => {
  assert.ok(!readFileSync('app/careers/CareersClient.js', 'utf8').includes('href="#"'))
})

test('lookbook photos exist', () => {
  const s = readFileSync('app/lookbook/page.js', 'utf8')
  const imgs = [...s.matchAll(/url\('([^']+)'\)/g)].map(m => m[1])
  assert.equal(imgs.length, 3)
  for (const i of imgs) assert.ok(existsSync('public' + i), i)
})

test('brevo unsubscribe: no key = skip; blocklists one contact', async () => {
  assert.deepEqual(await unsubscribeFromBrevo('a@b.co', { env: {} }), { skipped: true })
  let call
  const r = await unsubscribeFromBrevo('a@b.co', { env: { BREVO_API_KEY: 'k' }, fetchImpl: async (u, o) => { call = { u, o }; return { ok: true, status: 204 } } })
  assert.deepEqual(r, { ok: true })
  assert.match(call.u, /contacts\/a%40b\.co$/)
  assert.equal(call.o.method, 'PUT')
  assert.deepEqual(JSON.parse(call.o.body), { emailBlacklisted: true })
})
