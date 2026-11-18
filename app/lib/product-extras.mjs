/**
 * Extra product-page content kept in code rather than in the products table: a fixed photo gallery
 * (with placeholder slots until the real photos exist) and a spec block.
 * Pure helpers; unit-tested in tests/product-extras.test.mjs.
 *
 * Adding a real photo to a slot:
 *   1. Save the file at public/products/<slug>/<file> (the exact name listed below).
 *   2. Set `ready: true` on that slot.
 * Until a slot is ready, the page shows a labelled "Photo coming soon" tile in its place.
 *
 * Spec values are null until they are confirmed. A null value shows as "Coming soon" on the page.
 * Never fill one in with a guess.
 */

export const SPEC_PENDING_LABEL = 'Coming soon'

export const PRODUCT_EXTRAS = {
  'vibin-tote-bag': {
    gallery: [
      { file: 'tote-01-back.webp', label: 'Back view', ready: true,
        alt: 'Back of the Vibin Tote Bag: black canvas with a turquoise star in the center and the Vibin Apparel wordmark below it.' },
      { file: 'tote-02-inside.webp', label: 'Inside view', ready: true,
        alt: 'Looking straight down into the open Vibin Tote Bag: black lining, one flat slip pocket on the inner wall.' },
      { file: 'tote-03-magnetic-snap.webp', label: 'Magnetic snap closure', ready: true,
        alt: 'Close-up of the top of the Vibin Tote Bag showing the black magnetic snap closure.' },
      { file: 'tote-04-what-fits.webp', label: 'What fits', ready: true,
        alt: 'The Vibin Tote Bag standing upright and full, with a hoodie, a water bottle, sunglasses and a phone inside.' },
    ],
    specs: [
      { label: 'Material', value: null },
      { label: 'Dimensions', value: null },
      { label: 'Weight', value: null },
      { label: 'Capacity', value: null },
      { label: 'Pockets', value: null },
      { label: 'Care', value: null },
    ],
    features: ['Magnetic snap closure'],
  },
}

/** The extras entry for a product, matched by slug. null when it has none. */
export function extrasFor(product) {
  const slug = product && typeof product.slug === 'string' ? product.slug : null
  return (slug && PRODUCT_EXTRAS[slug]) || null
}

/** Public path for a gallery slot's file. */
export function slotPath(slug, file) {
  return `/products/${slug}/${file}`
}

/**
 * Gallery items for the product page, in order: the product's own photos first (from the products
 * table), then the extras slots. Each item is { src, alt, label, placeholder }. A slot that is not
 * ready has src null and placeholder true.
 */
export function galleryItems(product, photos = []) {
  const items = (Array.isArray(photos) ? photos : [])
    .filter(src => typeof src === 'string' && src)
    .map(src => ({ src, alt: product?.name || '', label: null, placeholder: false }))
  const extras = extrasFor(product)
  if (!extras) return items
  for (const slot of extras.gallery || []) {
    const src = slot.ready ? slotPath(product.slug, slot.file) : null
    if (src && items.some(i => i.src === src)) continue
    items.push({ src, alt: slot.alt, label: slot.label, placeholder: !src })
  }
  return items
}

/** Spec rows ready to show: { label, value } with pending values replaced by the "Coming soon" label. */
export function specRows(product) {
  const extras = extrasFor(product)
  if (!extras) return []
  return (extras.specs || []).map(s => ({
    label: s.label,
    value: typeof s.value === 'string' && s.value.trim() ? s.value.trim() : SPEC_PENDING_LABEL,
    pending: !(typeof s.value === 'string' && s.value.trim()),
  }))
}

/** Feature list for the spec block ([] when none). */
export function featureList(product) {
  const extras = extrasFor(product)
  return extras && Array.isArray(extras.features) ? extras.features.slice() : []
}
