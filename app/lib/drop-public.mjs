/**
 * Public, client-safe Drop 01 window: plain data with no imports, so the header and the home page can
 * use it without pulling the Supabase client into the browser bundle. app/lib/drops.js builds its
 * fallback config from this; the `drops` table stays the source of truth for checkout.
 */
export const DROP_01 = {
  id: 'd01',
  shortName: 'Drop 01',
  opensAt: '2027-01-15T00:00:00Z', // Thu Jan 14, 2027 7:00 PM ET
  closesAt: '2027-01-18T04:59:59Z', // Sun Jan 17, 2027 11:59 PM ET (close time confirmed by Josias, Nov 18)
  earlyAccessAt: '2027-01-14T23:00:00Z', // Thu Jan 14, 2027 6:00 PM ET (waitlist hour)
  // Jan 14 lineup (Josias, Nov 20 9:36/9:38 AM ET): Foundation Tee (te) + Snapback (sb) only, 50 numbered
  // pieces per style. The VOL 01 Hoodie (hd) is pulled from the site until samples arrive ('hidden' = not shown,
  // not sold). Enforced at checkout through drops.js isStylePurchasable().
  availability: { hd: 'hidden', cj: 'coming-soon', wb: 'coming-soon', ns: 'hidden', te: 'available', sb: 'available' },
  // Drop 01 flatlay (Josias' Top pick #1) as the page hero, a mockup from Muse's email (Nov 18, 2026).
  // Hero off (Nov 20): the only Drop 01 flatlay shows the held hoodie. ready:false hides it; no new art made.
  hero: { src: '/drop01/flatlay-hero.webp', ready: false, alt: 'Drop 01 flatlay (mockup): a black hoodie, black boxer briefs with a turquoise waistband, black and turquoise shorts and a First Drop card laid out together.' },
  shipsBy: null, // No public ship date until vendor proof is in; copy leaves the line out while this is empty
}

// Legal numbered claim + mark qualifier, word-for-word from /workspace/legal/drop01-numbered-claim-review.md and
// /workspace/product/pdp-cart-jan14-nov16.md. Same text on every surface (PDPs, /drop/01, cart, confirmation, meta).
export const DROP01_CAP_COPY = 'Limited to 50 Foundation Tees (all colors and sizes combined) and 50 Snapbacks. Each is individually numbered 1–50.'
export const DROP01_MARK_COPY = 'Each Foundation Tee is marked Tee XX/50 (DTF). Each Snapback is marked Cap XX/50 (embroidered; placement to be confirmed).'

// Legal's numbered-claim gates (all must be true before the claim is public): Josias confirms "50 per style,
// 100 total" in his own words; every piece sold is or will be physically marked Tee XX/50 / Cap XX/50; the hard
// cap is live in checkout (code + the separate DB step); /qa restock copy is rewritten in the same deploy.
// While false, no surface shows a count or a numbered claim (Product's "customer string now"). The 50-per-style
// cap is enforced in checkout either way. Flip to true only with Josias's yes.
export const DROP01_NUMBERED_CLAIM_LIVE = false

/** Cart line note for a Drop 01 Foundation Tee / Snapback line (Product row 36). */
export function drop01CartNote(claimLive = DROP01_NUMBERED_CLAIM_LIVE) {
  return claimLive
    ? `Drop 01 pre-order. ${DROP01_CAP_COPY} ${DROP01_MARK_COPY}`
    : 'Drop 01 pre-order. Dates will be confirmed soon.'
}
