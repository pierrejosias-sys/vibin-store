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
  // Approved launch lineup (Oct 22, 2026): only hd is for sale; 'hidden' styles are not shown at all.
  // Enforced at checkout through drops.js isStylePurchasable().
  availability: { hd: 'available', cj: 'coming-soon', wb: 'coming-soon', ns: 'hidden' },
  // Drop 01 flatlay (Josias' Top pick #1) as the page hero. Save it at public/drop01/flatlay-hero.webp and
  // set ready: true. Until then no hero shows.
  hero: { src: '/drop01/flatlay-hero.webp', ready: false, alt: 'Drop 01 flatlay (mockup): The Foundation pieces laid out together.' },
  shipsBy: null, // No public ship date until vendor proof is in; copy leaves the line out while this is empty
}
