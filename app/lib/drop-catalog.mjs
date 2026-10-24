/**
 * Regular catalog products sold as part of a drop window (in-house, manual fulfillment —
 * they are NOT in PRINTFUL_VARIANT_MAP, so splitCart() keeps them as manual lines).
 * Pure helpers; unit-tested in tests/drop-catalog.test.mjs.
 */
import { dropPhase } from './drop-window.mjs'

export const DROP_CATALOG = {
  d01: [
    { productId: 1, slug: 'vibin-classic-tee', name: 'Foundation Tee', price: 85, sizes: ['S', 'M', 'L', 'XL', '2X', '3X', '4X'],
      images: ['/drop01/tee-shgdd-front.webp'], square: '/drop01/tee-shgdd-front-square.webp' },
    { productId: 10, slug: 'vibin-snapback', name: 'Snapback', price: 65, sizes: ['OS'],
      images: ['/drop01/snapback-6089m-hero.webp', '/drop01/snapback-6089m-hero-flat.webp'] },
  ],
}

/**
 * Blank (garment) per size for the Foundation Tee. 3X and up are cut on the SHGD blank.
 * The tee is fulfilled in-house (manual lines, not Printful), so this is the reference used when
 * ordering blanks / if the tee is ever moved to Printful.
 * TODO(printful): SHGD Printful variant ids for 3X and 4X are NOT known in this repo. Look them up
 * (GET https://api.printful.com/products/<SHGD product id>) and fill in `variant_id` before adding
 * any `vibin-classic-tee:<size>` keys to PRINTFUL_VARIANT_MAP. Do not guess ids.
 */
export const TEE_BLANKS = {
  S: { blank: 'SHGDD' }, M: { blank: 'SHGDD' }, L: { blank: 'SHGDD' }, XL: { blank: 'SHGDD' }, '2X': { blank: 'SHGDD' },
  '3X': { blank: 'SHGD', variant_id: null }, // TODO: SHGD 3X Printful variant id unknown
  '4X': { blank: 'SHGD', variant_id: null }, // TODO: SHGD 4X Printful variant id unknown
}

/**
 * Colorways for numbered drop styles (VOL 01 Hoodie = Lane Seven LS17001).
 * Only `active` colors are shown, accepted at checkout and routed to Printful.
 * Inactive rows are kept (not deleted) so a colorway can be brought back by flipping the flag.
 */
export const DROP_STYLE_COLORS = {
  d01: {
    hd: [
      { name: 'Black', active: true, images: ['/drop01/hoodie-ls17001-black-front.webp'] },
      { name: 'Cream', active: false, images: ['/drop01/hoodie-ls17001-cream-front.webp'] }, // hidden 2026-10-23: Drop 01 hoodie is black only
    ],
  },
}

/** Active colorways for a drop style ([] when the style has no color config). */
export function activeStyleColors(dropId, styleCode) {
  return (DROP_STYLE_COLORS[dropId]?.[styleCode] || []).filter(c => c.active)
}

/**
 * True when `color` is an active colorway for the style. Styles without a color config accept any color
 * (they are single-color in-house items). Returns the canonical color name, or null if not allowed.
 */
export function allowedStyleColor(dropId, styleCode, color) {
  const all = DROP_STYLE_COLORS[dropId]?.[styleCode]
  if (!all) return typeof color === 'string' && color.trim() ? color.trim() : 'Black'
  const want = String(color ?? '').trim().toLowerCase()
  const hit = all.find(c => c.active && c.name.toLowerCase() === want)
  return hit ? hit.name : null
}

/** Product shots for numbered drop styles: images of active colorways only. */
export const DROP_STYLE_IMAGES = Object.fromEntries(Object.entries(DROP_STYLE_COLORS).map(([d, styles]) =>
  [d, Object.fromEntries(Object.entries(styles).map(([code, colors]) => [code, colors.filter(c => c.active).flatMap(c => c.images)]))]))

export const TWO_PACKAGES_NOTE = 'Ships in two packages: your hoodie ships separately from your tee/snapback, so your order may arrive in two packages.'

/**
 * True when a cart mixes the print-on-demand hoodie (drop style 'hd') with an in-house
 * item (Foundation Tee / Snapback): those ship from different places.
 */
export function shipsInTwoPackages(items) {
  const list = Array.isArray(items) ? items : []
  const hasHoodie = list.some(i => i?.drop && i?.style === 'hd')
  const hasInHouse = list.some(i => !i?.drop && dropCatalogEntry(i))
  return hasHoodie && hasInHouse
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
