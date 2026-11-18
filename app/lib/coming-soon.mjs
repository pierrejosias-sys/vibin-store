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
    }))
}

export function colorSummary(colors) {
  const n = Array.isArray(colors) ? colors.length : 0
  if (n <= 1) return ''
  if (n <= 3) return colors.join(', ')
  return `${n} colors`
}
