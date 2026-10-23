/** Floating Help button placement (pure; tested in tests/help-fab.test.mjs). */
// Never let the closed Help button sit on top of these (Add to Bag, checkout/pay buttons, cart/checkout totals).
export const HELP_AVOID = '.btn-atc, .btn-checkout, .btn-bnp, .cart-total, .checkout-total, .nl-btn, [data-help-avoid]'
const GAP = 8

/** Pure: how far (px) to lift a button at `btn` so it clears every rect in `avoid`; null = hide (no room). */
export function liftFor(btn, avoid, viewportH, maxLiftRatio = 0.45) {
  let lift = 0
  for (let pass = 0; pass < 4; pass++) {
    const b = { top: btn.top - lift, bottom: btn.bottom - lift, left: btn.left, right: btn.right }
    const hit = avoid.find(r => r.width !== 0 && r.left < b.right && r.right > b.left && r.top < b.bottom + GAP && r.bottom > b.top - GAP)
    if (!hit) return lift
    lift = btn.bottom - hit.top + GAP
    if (lift > viewportH * maxLiftRatio) return null
  }
  return null
}
