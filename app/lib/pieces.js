/**
 * Server-only helpers for numbered drop pieces (service-role RPCs).
 * See supabase/migrations/20261022000001_drops_numbered_pieces.sql
 */
import { DROPS, sizesForStyle, PIECE_HOLD_MINUTES, isStylePurchasable } from './drops'
import { dropPhase, serverNow } from './drop-window.mjs'

export function isDropItem(item) {
  return !!(item && item.drop && item.style)
}

/** Validates drop cart items and resolves authoritative price/name from the DB (fallback: config). */
export async function resolveDropItems(supabase, items) {
  const dropItems = items.filter(isDropItem)
  if (!dropItems.length) return { dropItems: [] }

  const dropIds = [...new Set(dropItems.map(i => i.drop))]
  const [{ data: drops }, { data: styles }] = await Promise.all([
    supabase.from('drops').select('id, name, release_at, closes_at').in('id', dropIds),
    supabase.from('drop_styles').select('drop_id, style_code, name, price').in('drop_id', dropIds),
  ])

  for (const item of dropItems) {
    const drop = drops?.find(d => d.id === item.drop)
    if (!drop || !DROPS[item.drop]) return { error: 'Unknown drop.' }
    if (!isStylePurchasable(item.drop, item.style)) return { error: 'This item is not available for purchase yet.', status: 409 }
    const phase = dropPhase(drop.release_at, drop.closes_at, serverNow())
    if (phase === 'tba' || phase === 'upcoming') return { error: `${drop.name} pre-order has not opened yet.`, status: 409 }
    if (phase === 'closed') return { error: `${drop.name} pre-order is closed.`, status: 409 }
    if (!sizesForStyle(item.style).includes(item.size)) return { error: 'Invalid size.' }
    const qty = Number(item.qty)
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) return { error: 'Invalid quantity.' }
    const row = styles?.find(s => s.drop_id === item.drop && s.style_code === item.style)
    const cfg = DROPS[item.drop].styles.find(s => s.code === item.style)
    const price = row?.price != null ? Number(row.price) : cfg?.price
    if (!row || price == null) return { error: 'Unknown style.' }
    item.qty = qty
    item.price = price // never trust the client price for drop items
    item.name = `${row.name} — ${drop.name}`
    item.preorder = true
    item.shipsBy = DROPS[item.drop].shipsBy
  }
  return { dropItems }
}

/** Claims pieces for every drop item (all-or-nothing). Returns { pieceIds } or { soldOut }. */
export async function claimDropPieces(supabase, dropItems) {
  const claimed = []
  for (const item of dropItems) {
    const { data, error } = await supabase.rpc('claim_pieces', {
      p_drop_id: item.drop,
      p_style_code: item.style,
      p_size: item.size,
      p_qty: item.qty,
      p_hold_minutes: PIECE_HOLD_MINUTES,
    })
    if (error || !data || data.length < item.qty) {
      await releasePieces(supabase, claimed.map(p => p.id))
      if (error) throw new Error(error.message)
      return { soldOut: { name: item.name, size: item.size } }
    }
    claimed.push(...data)
    item.pieces = data.map(p => ({ id: p.id, number: p.number }))
  }
  return { pieceIds: claimed.map(p => p.id) }
}

export async function releasePieces(supabase, ids, sessionId = null) {
  if (!ids?.length) return 0
  const { data, error } = await supabase.rpc('release_pieces', { p_piece_ids: ids, p_session_id: sessionId })
  if (error) console.error('release_pieces failed:', error.message)
  return data || 0
}

// Stripe metadata values are capped at 500 chars, so piece ids are chunked
// across pieceIds_0, pieceIds_1, ... keys (≈13 UUIDs per key).
export function pieceIdsToMetadata(ids) {
  const meta = {}
  const per = 13
  for (let i = 0; i * per < ids.length; i++) meta[`pieceIds_${i}`] = ids.slice(i * per, (i + 1) * per).join(',')
  return meta
}

export function pieceIdsFromMetadata(metadata = {}) {
  return Object.keys(metadata)
    .filter(k => k.startsWith('pieceIds_'))
    .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]))
    .flatMap(k => metadata[k].split(',').filter(Boolean))
}
