/**
 * Public, client-safe Drop 01 window: plain data with no imports, so the header and the home page can
 * use it without pulling the Supabase client into the browser bundle. app/lib/drops.js builds its
 * fallback config from this; the `drops` table stays the source of truth for checkout.
 */
export const DROP_01 = {
  id: 'd01',
  shortName: 'Drop 01',
  opensAt: '2026-11-20T00:00:00Z', // Thu Nov 19, 2026 7:00 PM ET
  closesAt: '2026-11-23T04:59:59Z', // Sun Nov 22, 2026 11:59 PM ET
  earlyAccessAt: '2026-11-19T23:00:00Z', // Thu Nov 19, 2026 6:00 PM ET (waitlist hour)
  shipsBy: 'Dec 18',
}
