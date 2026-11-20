/**
 * "Coming soon" pieces shown on /shop from the design spec files in public/designs.
 * They are not products rows: no price, no cart, nothing buyable. Only the name, the copy and the
 * color list reach the page, so TBD specs (price, vendor, ship date) never show.
 * Pure helper; unit-tested in tests/coming-soon.test.mjs.
 */
const KITA_GROUPS = ['kita-totes', 'kita-keychains', 'kita-charms', 'kita-lanyards']

function tileGroup(s) {
  if (s.group === 'top-picks') return 'top-picks'
  return KITA_GROUPS.includes(s.group) ? s.group : 'kita-totes'
}

function firstImage(s) {
  return Array.isArray(s.images) && typeof s.images[0] === 'string' && s.images[0] ? s.images[0] : null
}

/** Every coming-soon spec, photo or not (for checks and audits; the shop uses comingSoonTiles). */
export function comingSoonSpecs(specs) {
  return (Array.isArray(specs) ? specs : []).filter(s => s && s.status === 'coming_soon' && s.buyable === false)
}

/** Coming-soon pieces that have no photo yet. They stay off /shop until one is added. */
export function hiddenComingSoon(specs) {
  return comingSoonSpecs(specs).filter(s => !firstImage(s))
}

export function comingSoonTiles(specs) {
  return comingSoonSpecs(specs)
    // No blank tiles: a piece shows only once it has a photo.
    .filter(s => firstImage(s))
    .map(s => ({
      slug: s.slug,
      name: s.product,
      description: s.description,
      colors: (s.variants || []).map(v => v.name),
      priceLabel: 'Price coming soon',
      group: tileGroup(s),
      // Mockups only. A file listed in images lives at public/products/<slug>/<file>.
      image: `/products/${s.slug}/${firstImage(s)}`,
      imageLabel: 'Mockup',
    }))
}

/** Coming soon sections for the shop, in order, each with its own heading. Empty sections are left out. */
export function comingSoonSections(tiles) {
  const list = Array.isArray(tiles) ? tiles : []
  return [
    { id: 'top-picks', eyebrow: 'Coming Jan 14', title: 'Top Picks' },
    { id: 'kita-totes', eyebrow: 'Coming Jan 14', title: 'Totes' },
    { id: 'kita-keychains', eyebrow: 'Coming Jan 14', title: 'Keychains' },
    { id: 'kita-charms', eyebrow: 'Coming Jan 14', title: 'Charms' },
    { id: 'kita-lanyards', eyebrow: 'Coming Jan 14', title: 'Lanyards' },
  ].map(sec => ({ ...sec, items: list.filter(t => t.group === sec.id) })).filter(s => s.items.length > 0)
}

export function colorSummary(colors) {
  const n = Array.isArray(colors) ? colors.length : 0
  if (n <= 1) return ''
  if (n <= 3) return colors.join(', ')
  return `${n} colors`
}
