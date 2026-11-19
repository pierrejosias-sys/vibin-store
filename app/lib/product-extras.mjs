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
 *
 * fit / background (optional, per slot): a wide shot can set fit: 'contain' so the whole picture shows
 * in the square or 3:4 frame, with background filling the edges.
 *
 * description (optional): shown when the products table has no description of its own.
 *
 * hideStoredDescription / hideStoredColor: the products table still holds old copy for this product
 * that no longer matches it. While true, the product page ignores those columns (the Details block
 * carries the specs instead). Set false once the table is corrected.
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
    // Old row says "12oz canvas, interior zip pocket, 100% organic cotton" and color Natural; none of it is confirmed.
    hideStoredDescription: true,
    hideStoredColor: true,
  },
  'tech-short': {
    // Back view: the CLEAN back only (one flat continuous waistband). Never the v1 back with the wide flap.
    // Save it as public/products/tech-short/tech-short-back-clean.webp and set ready: true.
    gallery: [
      { file: 'tech-short-back-clean.webp', label: 'Back view (mockup)', ready: false,
        alt: 'Back of the Vibin Tech Short: one flat continuous waistband.' },
    ],
    specs: [],
    features: [],
  },
  // Two lanyards, two products (Josias, Nov 18 2026): Wordmark keeps the original lanyard row and URL,
  // Star is its own row (supabase/migrations/20261118000005_lanyard_wordmark_star.sql).
  // Images are mockups (not product photos), cropped from the one image Muse emailed to Josias.
  lanyard: {
    gallery: [
      { file: 'lanyard-wordmark-01.webp', label: 'Mockup', ready: true, fit: 'contain', background: '#f3efec',
        alt: 'Mockup of the Vibin Lanyard, Wordmark design: black-edged teal strap with a white star and VIBIN wordmark repeated along it and SS26 Drop 01 near the clasp.' },
    ],
    description: 'The Vibin Lanyard in the Wordmark design: black-edged teal with the white VIBIN wordmark. One size. Image shown is a mockup.',
    specs: [
      { label: 'Material', value: null },
      { label: 'Length', value: null },
      { label: 'Clip', value: null },
      { label: 'Care', value: null },
    ],
    features: [],
  },
  'lanyard-star': {
    gallery: [
      { file: 'lanyard-star-01.webp', label: 'Mockup', ready: true, fit: 'contain', background: '#f3efec',
        alt: 'Mockup of the Vibin Lanyard, Star design: solid teal strap with a four-point star pattern and a silver clasp.' },
    ],
    description: 'The Vibin Lanyard in the Star design: solid teal with a star pattern and a silver clasp. One size. Image shown is a mockup.',
    specs: [
      { label: 'Material', value: null },
      { label: 'Length', value: null },
      { label: 'Clip', value: null },
      { label: 'Care', value: null },
    ],
    features: [],
  },
}

/** The extras entry for a product, matched by slug. null when it has none. */
export function extrasFor(product) {
  const slug = product && typeof product.slug === 'string' ? product.slug : null
  return (slug && PRODUCT_EXTRAS[slug]) || null
}

/**
 * The product as the product page should show it: stored description and color dropped where the
 * extras say the table's copy is stale. Returns the same object when nothing is hidden.
 */
export function withExtras(product) {
  const extras = extrasFor(product)
  if (!extras) return product
  const stored = typeof product.description === 'string' && product.description.trim() ? product.description : null
  const keepStored = stored && !extras.hideStoredDescription
  const fallback = typeof extras.description === 'string' && extras.description.trim() ? extras.description : null
  const description = keepStored ? stored : fallback
  const changeDescription = description !== (product.description ?? null)
  if (!changeDescription && !extras.hideStoredColor) return product
  return {
    ...product,
    ...(changeDescription ? { description } : {}),
    ...(extras.hideStoredColor ? { color: null } : {}),
  }
}

/**
 * Card image for a product that has no photo in the products table: its first ready gallery slot.
 * Returns { src, fit, background } or null.
 */
export function coverImage(product) {
  const extras = extrasFor(product)
  const slot = extras && (extras.gallery || []).find(s => s.ready)
  if (!slot) return null
  return { src: slotPath(product.slug, slot.file), fit: slot.fit || 'cover', background: slot.background || null }
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
    items.push({ src, alt: slot.alt, label: slot.label, placeholder: !src, fit: slot.fit || 'cover', background: slot.background || null })
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
