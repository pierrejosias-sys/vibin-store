import test from 'node:test'
import assert from 'node:assert/strict'
import { orderForDisplay, featuredForHome, homeCategories } from '../app/lib/home-helpers.mjs'
import { dropPromoLine, dropBlockCopy, countdownParts, openDateShort, windowLabelShort, earlyAccessLabel } from '../app/lib/drop-copy.mjs'
import { DROP_01 } from '../app/lib/drop-public.mjs'
import { DROPS } from '../app/lib/drops.js'
import { dropPhase } from '../app/lib/drop-window.mjs'

// The real catalog (Nov 18, 2026), newest first as the database returns it.
const P = (id, slug, name, category, tags, extra = {}) => ({ id, slug, name, category, tags, color: null, in_stock: true, image_url: null, images: null, ...extra })
const S3 = n => `https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/${n}.png`
const CATALOG = [
  P(14, 'lanyard', 'Vibin Lanyard', 'accessories', ['new']),
  P(13, 'tech-short', 'Tech Short', 'bottoms', ['new', 'bottoms', 'shorts', 'tech'], { image_url: S3('tech') }),
  P(6, 'vibin-cargo-shorts', 'Vibin Cargo Shorts', 'bottoms', ['bottoms', 'shorts', 'cargo'], { image_url: S3('cargo') }),
  P(11, 'vibin-tote-bag', 'Vibin Tote Bag', 'accessories', ['accessories', 'bag'], { image_url: S3('tote'), in_stock: false }),
  P(4, 'vibin-oversized-hoodie', 'Vibin Oversized Hoodie', 'tops', ['tops', 'hoodie', 'bestseller'], { image_url: S3('hoodie') }),
  P(12, 'vibin-zip-up-hoodie', 'Vibin Zip-Up Hoodie', 'tops', ['tops', 'hoodie', 'zip-up'], { image_url: S3('zip') }),
  P(8, 'vibin-joggers', 'Vibin Joggers', 'bottoms', ['bottoms', 'joggers'], { image_url: S3('joggers') }),
  P(10, 'vibin-snapback', 'Snapback', 'accessories', ['accessories', 'hat'], { image_url: '/drop01/snapback-6089m-hero.webp' }),
  P(1, 'vibin-classic-tee', 'Foundation Tee', 'tops', ['new', 'tops', 'essential'], {
    color: 'Black',
    images: [{ kind: 'hero', url: '/drop01/tee-shgdd-front.webp' }, { kind: 'square', url: '/drop01/tee-shgdd-front-square.webp' }],
  }),
]

test('Drop 01 pieces lead, then photographed pieces, then photo-less ones, sold-out last', () => {
  const slugs = orderForDisplay(CATALOG).map(p => p.slug)
  assert.deepEqual(slugs.slice(0, 2).sort(), ['vibin-classic-tee', 'vibin-snapback'])
  assert.equal(slugs.at(-1), 'vibin-tote-bag')
  assert.deepEqual(slugs.slice(2, -2), ['tech-short', 'vibin-cargo-shorts', 'vibin-oversized-hoodie', 'vibin-zip-up-hoodie', 'vibin-joggers'])
  assert.equal(slugs.at(-2), 'lanyard', 'the piece with no photo yet comes after every photographed piece, before sold-out')
  assert.equal(slugs.length, CATALOG.length)
})

test('a photo-less piece never outranks a photographed one, and a drop piece never falls behind either', () => {
  const noPhoto = P(50, 'new-thing', 'New Thing', 'tops', [])
  const photo = P(51, 'photo-thing', 'Photo Thing', 'tops', [], { image_url: S3('p') })
  assert.deepEqual(orderForDisplay([noPhoto, photo]).map(p => p.slug), ['photo-thing', 'new-thing'])
  const dropNoPhoto = P(10, 'vibin-snapback', 'Snapback', 'accessories', [])
  assert.equal(orderForDisplay([photo, noPhoto, dropNoPhoto])[0].slug, 'vibin-snapback')
})

test('ordering does not mutate its input and tolerates bad input', () => {
  const copy = CATALOG.map(p => p.slug)
  orderForDisplay(CATALOG)
  assert.deepEqual(CATALOG.map(p => p.slug), copy)
  assert.deepEqual(orderForDisplay(null), [])
  assert.deepEqual(orderForDisplay(undefined), [])
})

test('home grid shows the first 8 in display order', () => {
  const f = featuredForHome(CATALOG, 8)
  assert.equal(f.length, 8)
  assert.ok(!f.some(p => p.slug === 'vibin-tote-bag'), 'sold-out piece is the one that falls off')
  assert.equal(featuredForHome([], 8).length, 0)
})

test('category tiles have real counts and the right photos', () => {
  const cats = homeCategories(CATALOG)
  assert.deepEqual(cats.map(c => [c.key, c.count]), [['tees', 1], ['hoodies', 2], ['bottoms', 3], ['accessories', 3]])
  const by = Object.fromEntries(cats.map(c => [c.key, c]))
  assert.equal(by.tees.image, '/drop01/tee-shgdd-front.webp') // the cream tee, not a hoodie
  assert.equal(by.hoodies.image, '/brand/cat-hoodie-black-model.jpg')
  assert.equal(by.bottoms.image, S3('tech'))
  assert.equal(by.accessories.image, '/drop01/snapback-6089m-hero.webp')
  assert.equal(by.tees.href, '/shop?cat=tees')
  assert.ok(!cats.some(c => c.key === 'crewnecks'), 'no crewnecks tile while there are none')
})

test('a category without photos still gets a tile (no image), and empty categories are skipped', () => {
  const only = [P(14, 'lanyard', 'Vibin Lanyard', 'accessories', ['new'])]
  const cats = homeCategories(only)
  assert.equal(cats.length, 1)
  assert.equal(cats[0].image, null)
  assert.deepEqual(homeCategories([]), [])
  assert.deepEqual(homeCategories(null), [])
})

test('falls back to the first photographed piece when a preferred cover is missing', () => {
  const list = CATALOG.filter(p => p.slug !== 'tech-short')
  assert.equal(homeCategories(list).find(c => c.key === 'bottoms').image, S3('cargo'))
})

test('promo line follows the pre-order window and never claims "live" early', () => {
  assert.equal(dropPromoLine(DROP_01, null), 'Drop 01 · The Foundation')
  assert.equal(dropPromoLine(DROP_01, 'tba'), 'Drop 01 · The Foundation')
  assert.equal(dropPromoLine(DROP_01, 'upcoming'), 'Drop 01 pre-order opens Thu, Jan 14, 7:00 PM ET')
  assert.equal(dropPromoLine(DROP_01, 'open'), 'Drop 01 pre-order is open · closes Sun, Jan 17, 11:59 PM ET')
  assert.equal(dropPromoLine(DROP_01, 'closed'), 'Drop 01 pre-order is closed')
  for (const ph of [null, 'upcoming', 'open', 'closed']) assert.ok(!/is live/i.test(dropPromoLine(DROP_01, ph)))
})

test('home block copy per phase', () => {
  assert.equal(dropBlockCopy(DROP_01, null).cta.href, '#email-signup')
  assert.equal(dropBlockCopy(DROP_01, 'upcoming').eyebrow, 'Pre-order opens · Thu, Jan 14, 7:00 PM ET')
  assert.equal(dropBlockCopy(DROP_01, 'upcoming').counting, 'Opens in')
  const open = dropBlockCopy(DROP_01, 'open')
  assert.equal(open.cta.href, '/drop/01')
  assert.equal(open.counting, 'Closes in')
  const closed = dropBlockCopy(DROP_01, 'closed')
  assert.equal(closed.counting, null)
  // No public ship date while DROP_01.shipsBy is empty: the line is left out, not printed as "null".
  assert.match(closed.body, /pre-orders are closed\. Join the list/)
  assert.ok(!/ship/i.test(closed.body) && !/ship/i.test(open.body))
  assert.match(dropBlockCopy({ ...DROP_01, shipsBy: 'Feb 12' }, 'closed').body, /ship by Feb 12/)
})

test('postponed Drop 01 labels come from the config (Jan 14, 2027)', () => {
  assert.equal(openDateShort(DROP_01), 'Jan 14')
  assert.equal(windowLabelShort(DROP_01), 'Jan 14 to 17')
  assert.equal(earlyAccessLabel(DROP_01), 'Thu Jan 14, 6:00–7:00 PM ET')
  // window that crosses a month, and an early hour that crosses noon
  assert.equal(windowLabelShort({ opensAt: '2027-01-30T17:00:00Z', closesAt: '2027-02-03T04:59:59Z' }), 'Jan 30 to Feb 2')
  assert.equal(earlyAccessLabel({ earlyAccessAt: '2027-01-14T16:00:00Z', opensAt: '2027-01-14T17:00:00Z' }), 'Thu Jan 14, 11:00 AM–12:00 PM ET')
  assert.equal(windowLabelShort({}), '')
  assert.equal(earlyAccessLabel({}), '')
  assert.equal(DROP_01.shipsBy, null)
})

test('no phase of the public copy mentions the old Nov 19 / Dec 18 plan', () => {
  for (const ph of [null, 'tba', 'upcoming', 'open', 'closed']) {
    const text = [dropPromoLine(DROP_01, ph), JSON.stringify(dropBlockCopy(DROP_01, ph))].join(' ')
    assert.ok(!/Nov|Dec 18/.test(text), `phase ${ph}: ${text}`)
  }
})

test('countdown parts', () => {
  assert.deepEqual(countdownParts(((1 * 24 + 13) * 3600 + 48 * 60 + 22) * 1000), { d: 1, h: 13, m: 48, s: 22 })
  assert.deepEqual(countdownParts(-5000), { d: 0, h: 0, m: 0, s: 0 })
  assert.deepEqual(countdownParts(999), { d: 0, h: 0, m: 0, s: 0 })
})

test('the public window is the single source for the drop config', () => {
  assert.equal(DROPS.d01.releaseAt, DROP_01.opensAt)
  assert.equal(DROPS.d01.closesAt, DROP_01.closesAt)
  assert.equal(DROPS.d01.earlyAccessAt, DROP_01.earlyAccessAt)
  assert.equal(DROPS.d01.shipsBy, DROP_01.shipsBy)
  // Thu Jan 14, 2027 7:00 PM ET opens; Sun Jan 17 11:59 PM ET closes; waitlist hour is 6:00 PM ET
  assert.equal(dropPhase(DROP_01.opensAt, DROP_01.closesAt, Date.parse('2026-11-19T23:59:59Z')), 'upcoming') // the old Nov 19 slot stays closed
  assert.equal(dropPhase(DROP_01.opensAt, DROP_01.closesAt, Date.parse('2026-11-20T00:00:00Z')), 'upcoming')
  assert.equal(dropPhase(DROP_01.opensAt, DROP_01.closesAt, Date.parse('2027-01-14T23:59:59Z')), 'upcoming')
  assert.equal(dropPhase(DROP_01.opensAt, DROP_01.closesAt, Date.parse('2027-01-15T00:00:00Z')), 'open')
  assert.equal(dropPhase(DROP_01.opensAt, DROP_01.closesAt, Date.parse('2027-01-18T05:00:00Z')), 'closed')
})
