/**
 * "Coming soon" pieces shown on /shop from the design spec files in public/designs.
 * They are not products rows: no price, no cart, nothing buyable. Only the name, the copy and the
 * color list reach the page, so TBD specs (price, vendor, ship date) never show.
 * Pure helper; unit-tested in tests/coming-soon.test.mjs.
 */
export function comingSoonTiles(specs) {
  return (Array.isArray(specs) ? specs : [])
    .filter(s => s && s.status === 'coming_soon' && s.buyable === false)
    .map(s => ({
      slug: s.slug,
      name: s.product,
      description: s.description,
      colors: (s.variants || []).map(v => v.name),
      priceLabel: 'Price coming soon',
      group: s.group === 'top-picks' ? 'top-picks' : 'kita',
      // Mockups only. A file listed in images lives at public/products/<slug>/<file>.
      image: Array.isArray(s.images) && typeof s.images[0] === 'string' && s.images[0]
        ? `/products/${s.slug}/${s.images[0]}` : null,
      imageLabel: Array.isArray(s.images) && s.images.length ? 'Mockup' : null,
    }))
}

/** Coming soon sections for the shop, in order, each with its own heading. Empty sections are left out. */
export function comingSoonSections(tiles) {
  const list = Array.isArray(tiles) ? tiles : []
  return [
    { id: 'top-picks', eyebrow: 'Coming Jan 14', title: 'Top Picks', items: list.filter(t => t.group === 'top-picks') },
    { id: 'kita', eyebrow: 'Coming soon', title: 'Totes & Keychains', items: list.filter(t => t.group !== 'top-picks') },
  ].filter(s => s.items.length > 0)
}

export function colorSummary(colors) {
  const n = Array.isArray(colors) ? colors.length : 0
  if (n <= 1) return ''
  if (n <= 3) return colors.join(', ')
  return `${n} colors`
}
