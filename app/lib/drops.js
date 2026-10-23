/**
 * Vibin Apparel — Drops config + server helpers
 * Source of truth for release time is the `drops` table (see
 * supabase/migrations/20261022000001_drops_numbered_pieces.sql). The config
 * below is the fallback when the table/env is unavailable.
 */
import { createClient } from '@supabase/supabase-js'

export const STYLE_NAMES = {
  hd: 'Hoodie',
  cj: 'Cargo Jogger',
  wb: 'Windbreaker',
  ns: 'Nylon Shorts',
  tee: 'Tee',
}

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

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
    // ⚠️ PLACEHOLDER — release time not set yet. null = locked / "TBA".
    // Set the real value in the `drops` table (release_at); this is only a fallback.
    releaseAt: null,
    story: 'PLACEHOLDER — Drop 01 story copy goes here.',
    piecesPerStyle: 50,
    // ⚠️ PLACEHOLDER prices — confirm before release (drop_styles.price overrides).
    styles: [
      { code: 'hd', name: 'Hoodie', price: 85 },
      { code: 'cj', name: 'Cargo Jogger', price: 75 },
      { code: 'wb', name: 'Windbreaker', price: 95 },
      { code: 'ns', name: 'Nylon Shorts', price: 55 },
    ],
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
  const state = { ...base, styles: base.styles.map(s => ({ ...s, remaining: null, sizes: {} })), inventoryAvailable: false }
  const supabase = publicClient()
  if (!supabase) return state

  try {
    const [{ data: drop }, { data: styles }] = await Promise.all([
      supabase.from('drops').select('name, story, release_at, pieces_per_style').eq('id', dropId).maybeSingle(),
      supabase.from('drop_styles').select('style_code, name, price, sort_order').eq('drop_id', dropId).order('sort_order'),
    ])
    if (drop) {
      state.name = drop.name || state.name
      state.story = drop.story || state.story
      state.releaseAt = drop.release_at
      state.piecesPerStyle = drop.pieces_per_style || state.piecesPerStyle
    }
    if (styles?.length) {
      state.styles = styles.map(s => {
        const cfg = base.styles.find(c => c.code === s.style_code) || {}
        return { code: s.style_code, name: s.name, price: s.price != null ? Number(s.price) : cfg.price ?? null, remaining: null, sizes: {} }
      })
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

export function isReleased(releaseAt, now = Date.now()) {
  return !!releaseAt && new Date(releaseAt).getTime() <= now
}
