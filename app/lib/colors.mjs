// Swatch colors for the product page (pure; unit-tested in tests/catalog-helpers.test.mjs).
// A product's swatch used to be black no matter what its color was ("Olive" showed a black dot).
const HEX = {
  black: '#111111', white: '#f6f6f2', cream: '#e8dcc4', natural: '#e3d9c0', sand: '#cdbd9c', stone: '#b9b2a2',
  grey: '#8a8a8a', gray: '#8a8a8a', charcoal: '#3a3a3a', onyx: '#1c1c1c',
  olive: '#4a4e3a', forest: '#1f3a2a', sage: '#9caf88', navy: '#1b2a4a', teal: '#01696f',
  red: '#b3261e', coral: '#ff4a3d', brown: '#5a3d2b', tan: '#b08d62', violet: '#7a4fb3', acid: '#d4ff3c',
}

/** Hex for a color name, or a neutral grey when the name is not one we know. */
export function swatchHex(name) {
  return HEX[String(name || '').trim().toLowerCase()] || '#9a9a9a'
}

/**
 * The colorways a product page should offer: the images[{color, hex}] entries when the product has
 * several, otherwise its single color. A product with no color gets none (no invented "Black").
 */
export function colorwaysFor(product) {
  const list = Array.isArray(product?.images) ? product.images : []
  const withColor = list.filter(i => i && typeof i.color === 'string' && i.color)
  if (withColor.length) {
    return withColor.map(i => ({ color: i.color, hex: i.hex || swatchHex(i.color), isDefault: !!i.is_default }))
  }
  if (typeof product?.color === 'string' && product.color.trim()) {
    return [{ color: product.color.trim(), hex: swatchHex(product.color), isDefault: true }]
  }
  return []
}

/** The colorway selected when the page opens. */
export function defaultColor(colorways) {
  return (colorways.find(c => c.isDefault) || colorways[0])?.color ?? null
}
