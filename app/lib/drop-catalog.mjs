/**
 * Regular catalog products sold as part of a drop window (in-house, manual fulfillment —
 * they are NOT in PRINTFUL_VARIANT_MAP, so splitCart() keeps them as manual lines).
 * Pure helpers; unit-tested in tests/drop-catalog.test.mjs.
 */
import { dropPhase } from './drop-window.mjs'

export const DROP_CATALOG = {
  d01: [
    { productId: 1, slug: 'vibin-classic-tee', name: 'Foundation Tee', price: 85, sizes: ['S', 'M', 'L', 'XL', '2X', '3X'] },
    { productId: 10, slug: 'vibin-snapback', name: 'Snapback', price: 65, sizes: ['OS'] },
  ],
}

/** Finds the drop entry for a resolved catalog item (numeric DB id) or slug. */
export function dropCatalogEntry(item) {
  for (const [dropId, entries] of Object.entries(DROP_CATALOG)) {
    const e = entries.find(x => Number(item?.id) === x.productId || (item?.slug && item.slug === x.slug))
    if (e) return { dropId, entry: e }
  }
  return null
}

/**
 * Enforces the drop window + sizes for catalog items that belong to a drop.
 * `drops` = [{ id, name, release_at, closes_at }]. Mutates matching items (preorder, shipsBy).
 * Returns { error, status } or { preorderItems }.
 */
export function enforceDropCatalog(items, drops, { now = Date.now(), shipsBy = {}, earlyAccessGranted = false, earlyAccessAt = {} } = {}) {
  const preorderItems = []
  for (const item of items) {
    if (item.drop && item.style) continue // numbered drop pieces are handled by resolveDropItems
    const hit = dropCatalogEntry(item)
    if (!hit) continue
    const drop = drops.find(d => d.id === hit.dropId)
    if (!drop) return { error: 'Unknown drop.', status: 400 }
    let phase = dropPhase(drop.release_at, drop.closes_at, now)
    // Waitlist early-access hour: holders of a locked private link shop as if open.
    const ea = earlyAccessAt[hit.dropId]
    if (phase === 'upcoming' && earlyAccessGranted && ea && now >= new Date(ea).getTime()) phase = 'open'
    if (phase === 'tba' || phase === 'upcoming') return { error: `${hit.entry.name} is part of ${drop.name} — the pre-order has not opened yet.`, status: 409 }
    if (phase === 'closed') return { error: `${drop.name} pre-order is closed.`, status: 409 }
    if (!hit.entry.sizes.includes(String(item.size))) return { error: `Pick a size for ${hit.entry.name}.`, status: 400 }
    item.preorder = true
    item.shipsBy = shipsBy[hit.dropId] || null
    item.drop_window = hit.dropId
    preorderItems.push(item)
  }
  return { preorderItems }
}
