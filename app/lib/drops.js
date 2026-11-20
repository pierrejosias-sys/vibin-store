/**
 * Vibin Apparel — Drops config + server helpers
 * Source of truth for release time is the `drops` table (see
 * supabase/migrations/20261022000001_drops_numbered_pieces.sql). The config
 * below is the fallback when the table/env is unavailable.
 */
import { createClient } from '@supabase/supabase-js'
import { DROP_CATALOG } from './drop-catalog.mjs'
import { DROP_01, DROP01_NUMBERED_CLAIM_LIVE } from './drop-public.mjs'

export const STYLE_NAMES = {
  hd: 'Hoodie',
  cj: 'Cargo Jogger',
  wb: 'Windbreaker',
  ns: 'Nylon Shorts',
  tee: 'Tee',
  te: 'Foundation Tee',
  sb: 'Snapback',
}

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
// Per-style size runs (keys sent to checkout and the Printful variant map).
// te/sb must match DROP_CATALOG sizes (Foundation Tee S–3X, Snapback one size); a style's 50 numbers span all its sizes.
export const STYLE_SIZES = { hd: ['S', 'M', 'L', 'XL', '2X', '3X'], te: ['S', 'M', 'L', 'XL', '2X', '3X'], sb: ['OS'] }
export function sizesForStyle(styleCode) {
  return STYLE_SIZES[styleCode] || SIZES
}

// VOL 01 Hoodie product copy (drop_styles.description is the source of truth; this is the fallback).
// Blank: Lane Seven LS17001 via Printful (print-on-demand). No garment-dye or cord claims.
export const HOODIE_DESCRIPTION = 'Lane Seven heavyweight pullover hoodie (LS17001): 16.5 oz cotton/poly fleece, relaxed fit, raglan sleeves, kangaroo pocket and ribbed cuffs and hem. Double-layer hood with no cords. Front artwork is DTF printed. Printed to order.'

// Hold length for claimed pieces. Spec target is 10 min, but Stripe requires a
// Checkout Session to live at least 30 min, so the hold must outlast the session
// or a paid session could reference released pieces.
export const STRIPE_SESSION_MINUTES = 30
export const PIECE_HOLD_MINUTES = STRIPE_SESSION_MINUTES + 1

export const DROPS = {
  d01: {
    id: 'd01',
    slug: '01',
    name: 'Drop 01: The Foundation',
    // Pre-order window (source of truth: drops.release_at / drops.closes_at; this is the fallback).
    // Opens Thu Jan 14, 2027 7:00 PM ET; closes Sun Jan 17, 2027 11:59 PM ET.
    // The times live in drop-public.mjs so the browser can use them without loading this file.
    releaseAt: DROP_01.opensAt,
    closesAt: DROP_01.closesAt,
    // Private waitlist early access: Thu Jan 14, 2027 6:00 PM ET (1 hour before public open).
    earlyAccessAt: DROP_01.earlyAccessAt,
    shipsBy: DROP_01.shipsBy,
    // No count in the story; the cap is described only by the Legal claim line (and only once its gates clear).
    story: DROP01_NUMBERED_CLAIM_LIVE
      ? 'Drop 01 is the first numbered Vibin Apparel run, designed in Jacksonville, FL.'
      : 'Drop 01 is the first Vibin Apparel drop, designed in Jacksonville, FL.',
    // Use this story even when drops.story (DB) still has the older cap wording.
    storyFromConfig: true,
    careInfo: 'Machine wash cold inside out, hang dry, do not bleach, and do not iron the print.',
    // Hard cap: 50 per style (numbers 1–50, all sizes and colors combined). Never restocked:
    // pieces rows are only created by the seed migrations, and the DB caps number at 50 per (drop, style).
    piecesPerStyle: 50,
    // Approved prices (drop_styles.price is the source of truth; this is the fallback).
    styles: [
      { code: 'hd', name: 'VOL 01 Hoodie', price: 195, description: HOODIE_DESCRIPTION },
      { code: 'cj', name: 'Cargo Jogger', price: 88 },
      { code: 'wb', name: 'Windbreaker', price: 128 },
      { code: 'ns', name: 'Nylon Shorts', price: 58 },
      // Jan 14 lineup: sold through the Foundation Tee / Snapback product pages and cards (DROP_CATALOG
      // styleCode), but every unit claims a numbered piece, so each stops at 50.
      { code: 'te', name: 'Foundation Tee', price: 85 },
      { code: 'sb', name: 'Snapback', price: 65 },
    ],
    // Jan 14 lineup (Nov 20): te + sb for sale, hd hidden until samples arrive. Enforced in
    // /api/checkout via isStylePurchasable(); 'hidden' styles are not shown at all.
    availability: DROP_01.availability,
  },
}

export function dropBySlug(slug) {
  return Object.values(DROPS).find(d => d.slug === slug) || null
}

export function formatTag({ dropId, style, number, code }) {
  return `${dropId}-${style}-${String(number).padStart(3, '0')}-${code}`
}

const TAG_RE = /^(d\d{2})-([a-z]{2,4})-(\d{3})-([a-z0-9]{4})$/

export function parseTag(tag) {
  const m = TAG_RE.exec(String(tag || '').toLowerCase())
  if (!m) return null
  const number = parseInt(m[3], 10)
  if (number < 1 || number > 50) return null
  return { dropId: m[1], style: m[2], number, code: m[4] }
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Server-side: drop config merged with DB release time, prices, and inventory counts. */
export async function getDropState(dropId) {
  const base = DROPS[dropId]
  if (!base) return null
  const withAvailability = st => st
    .map(s => ({ ...s, availability: styleAvailability(dropId, s.code) }))
    .filter(s => s.availability !== 'hidden')
  const catalog = (DROP_CATALOG[dropId] || []).map(c => ({ ...c, inStock: true }))
  const state = { ...base, styles: withAvailability(base.styles.map(s => ({ ...s, remaining: null, sizes: {} }))), catalog, inventoryAvailable: false }
  const supabase = publicClient()
  if (!supabase) return state

  try {
    const [{ data: drop }, { data: styles }] = await Promise.all([
      supabase.from('drops').select('name, story, release_at, closes_at, pieces_per_style').eq('id', dropId).maybeSingle(),
      supabase.from('drop_styles').select('*').eq('drop_id', dropId).order('sort_order'),
    ])
    if (drop) {
      state.name = drop.name || state.name
      state.story = base.storyFromConfig ? state.story : (drop.story || state.story)
      state.releaseAt = drop.release_at
      state.closesAt = drop.closes_at ?? null
      state.piecesPerStyle = drop.pieces_per_style || state.piecesPerStyle
    }
    if (styles?.length) {
      state.styles = withAvailability(styles.map(s => {
        const cfg = base.styles.find(c => c.code === s.style_code) || {}
        return { code: s.style_code, name: s.name, price: s.price != null ? Number(s.price) : cfg.price ?? null, description: s.description || cfg.description || null, remaining: null, sizes: {} }
      }))
    }
    if (catalog.length) {
      const { data: prods } = await supabase.from('products').select('id, name, price, in_stock, color').in('id', catalog.map(c => c.productId))
      for (const c of state.catalog) {
        const p = prods?.find(x => Number(x.id) === c.productId)
        if (p) Object.assign(c, { name: p.name || c.name, price: Number(p.price), inStock: p.in_stock !== false, color: p.color || null })
      }
    }
  } catch (err) {
    console.warn('getDropState: drops lookup failed', err.message)
  }
  return state
}

/** Inventory counts (public RPC — counts only, never codes). */
export async function getDropInventory(state) {
  const supabase = publicClient()
  if (!supabase) return state
  const { data, error } = await supabase.rpc('drop_inventory', { p_drop_id: state.id })
  if (error || !data) return state
  state.inventoryAvailable = true
  for (const style of state.styles) {
    const rows = data.filter(r => r.style_code === style.code)
    const total = rows.find(r => r.size === null)
    style.remaining = total ? total.remaining : 0
    for (const r of rows) if (r.size) style.sizes[r.size] = r.remaining
  }
  return state
}

/** 'available' | 'coming-soon' | 'hidden'. Unknown styles are never purchasable. */
export function styleAvailability(dropId, styleCode) {
  return DROPS[dropId]?.availability?.[styleCode] || 'hidden'
}

export function isStylePurchasable(dropId, styleCode) {
  return styleAvailability(dropId, styleCode) === 'available'
}

export { dropPhase, formatET, serverNow } from './drop-window.mjs'

export function isReleased(releaseAt, now = Date.now()) {
  return !!releaseAt && new Date(releaseAt).getTime() <= now
}
