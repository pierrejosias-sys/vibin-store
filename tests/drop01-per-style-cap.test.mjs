// Drop 01 Jan 14 lineup (Josias, Nov 20): Foundation Tee + Snapback only, 50 numbered pieces per style,
// hoodie pulled until samples arrive. Legal (Nov 20): exact cap copy, no restock claims, refund rule.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DROP_01, DROP01_CAP_COPY, DROP01_MARK_COPY, DROP01_NUMBERED_CLAIM_LIVE, drop01CartNote } from '../app/lib/drop-public.mjs'
import { DROPS, isStylePurchasable, sizesForStyle, styleAvailability } from '../app/lib/drops.js'
import { DROP_CATALOG, enforceDropCatalog, catalogStyleCodes, shipsInTwoPackages, dropCatalogEntry, isDrop01NumberedLine } from '../app/lib/drop-catalog.mjs'
import { splitCart } from '../app/lib/printful-core.mjs'

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const drops = [{ id: 'd01', name: 'Drop 01', release_at: '2027-01-15T00:00:00Z', closes_at: '2027-01-18T04:59:59Z' }]
const OPEN = Date.parse('2027-01-16T00:00:00Z')
const tee = (size = 'M') => ({ id: 1, slug: 'vibin-classic-tee', size, qty: 1, color: 'Black' })
const snap = () => ({ id: 10, slug: 'vibin-snapback', size: 'OS', qty: 1 })

test('cap copy is Legal\'s numbered claim + mark qualifier, word-for-word, and gated off until the gates clear', () => {
  assert.equal(DROP01_CAP_COPY, 'Limited to 50 Foundation Tees (all colors and sizes combined) and 50 Snapbacks. Each is individually numbered 1–50.')
  assert.equal(DROP01_MARK_COPY, 'Each Foundation Tee is marked Tee XX/50 (DTF). Each Snapback is marked Cap XX/50 (embroidered; placement to be confirmed).')
  assert.equal(DROP01_NUMBERED_CLAIM_LIVE, false) // Josias's own words + physical marks still pending
  assert.equal(DROPS.d01.piecesPerStyle, 50)
  assert.doesNotMatch(DROPS.d01.story, /50|numbered/i)
  // Cart line note (Product row 36): customer string now, swap-in once the claim is live.
  assert.equal(drop01CartNote(false), 'Drop 01 pre-order. Dates will be confirmed soon.')
  assert.equal(drop01CartNote(true), `Drop 01 pre-order. ${DROP01_CAP_COPY} ${DROP01_MARK_COPY}`)
  assert.equal(drop01CartNote(), drop01CartNote(false))
  assert.equal(isDrop01NumberedLine({ id: 1, size: 'M' }), true)
  assert.equal(isDrop01NumberedLine({ id: 10, size: 'OS' }), true)
  assert.equal(isDrop01NumberedLine({ drop: 'd01', style: 'te' }), true)
  assert.equal(isDrop01NumberedLine({ drop: 'd01', style: 'hd' }), false)
  assert.equal(isDrop01NumberedLine({ id: 4, slug: 'vibin-oversized-hoodie' }), false)
})

test('hoodie no longer leads the visuals or meta', () => {
  assert.equal(DROP_01.hero.ready, false) // flatlay shows the hoodie
  const page = read('app/drop/01/page.js')
  assert.match(page, /image: '\/drop01\/tee-shgdd-front\.webp'/)
  assert.doesNotMatch(page, /image: '\/og-drop01|Hoodie/)
  assert.doesNotMatch(read('app/cart/page.js'), /hoodies/i)
})

test('hoodie is hidden and not purchasable; tee + snapback are the numbered styles for sale', () => {
  assert.equal(DROP_01.availability.hd, 'hidden')
  assert.equal(styleAvailability('d01', 'hd'), 'hidden')
  assert.equal(isStylePurchasable('d01', 'hd'), false)
  for (const s of ['te', 'sb']) {
    assert.equal(isStylePurchasable('d01', s), true)
    assert.ok(DROPS.d01.styles.some(x => x.code === s))
  }
  for (const s of ['cj', 'wb', 'ns']) assert.equal(isStylePurchasable('d01', s), false)
  assert.deepEqual([...catalogStyleCodes('d01')].sort(), ['sb', 'te'])
})

test('style sizes match the product size runs (one 50-number pool across all sizes)', () => {
  for (const e of DROP_CATALOG.d01) assert.deepEqual(sizesForStyle(e.styleCode), e.sizes)
})

test('tee/snapback bought through the regular cart become numbered-piece lines (cap not bypassable)', () => {
  // Product page / drop card cart line (numeric id) and old snapback cart id after resolveCatalogItems (id 10).
  const items = [tee('3X'), snap()]
  const r = enforceDropCatalog(items, drops, { now: OPEN })
  assert.equal(r.error, undefined)
  assert.deepEqual(items.map(i => [i.drop, i.style]), [['d01', 'te'], ['d01', 'sb']])
  // A slug-only line (no numeric id) is matched too.
  const bySlug = [{ slug: 'vibin-snapback', size: 'OS', qty: 1 }]
  enforceDropCatalog(bySlug, drops, { now: OPEN })
  assert.equal(bySlug[0].style, 'sb')
  // Before the window it is still blocked.
  assert.equal(enforceDropCatalog([tee()], drops, { now: Date.parse('2027-01-14T00:00:00Z') }).status, 409)
  // Converted lines stay manual (in-house) fulfillment, never Printful.
  const { podLines, manualLines } = splitCart(items, { 'hd:M': 1, 'hd:3X': 2 })
  assert.equal(podLines.length, 0); assert.equal(manualLines.length, 2)
  assert.equal(shipsInTwoPackages(items), false)
  assert.equal(shipsInTwoPackages([{ drop: 'd01', style: 'hd', size: 'M' }, ...items]), true)
})

test('checkout: numbered lines go through resolveDropItems + claim_pieces after the window check', () => {
  const route = read('app/api/checkout/route.js')
  assert.ok(route.indexOf('enforceDropCatalog(') < route.indexOf('resolveDropItems(supabase'))
  assert.ok(route.indexOf('resolveDropItems(supabase') < route.indexOf('claimDropPieces('))
  const pieces = read('app/lib/pieces.js')
  assert.match(pieces, /if \(!isStylePurchasable\(item\.drop, item\.style\)\)/)
  // No drop_styles row (pieces not seeded yet) = not purchasable, never uncapped.
  assert.match(pieces, /if \(!row \|\| price == null\) return \{ error: 'This item is not available for purchase yet\.', status: 409 \}/)
  assert.ok(dropCatalogEntry({ id: 1 }).entry.styleCode === 'te' && dropCatalogEntry({ id: 10 }).entry.styleCode === 'sb')
})

test('refunds retire numbers (webhook -> refund_pieces); partial refunds change nothing automatically', () => {
  const hook = read('app/api/webhook/route.js')
  assert.match(hook, /event\.type === 'charge\.refunded'/)
  assert.match(hook, /refundPieces\(supabase, pieceIds, session\.id\)/)
  assert.match(hook, /if \(!charge\.refunded\)/)
  assert.match(read('app/lib/pieces.js'), /rpc\('refund_pieces'/)
})

test('public copy: no bare "50 numbered pieces", no restock / always-sell-out claims, counts only from live inventory', () => {
  const drop = read('app/drop/DropClient.js')
  assert.doesNotMatch(drop, /numbered pieces per style|Limited to \{drop\.piecesPerStyle\} per style/)
  assert.match(drop, /DROP01_NUMBERED_CLAIM_LIVE && <p[^>]*>\{DROP01_CAP_COPY\} \{DROP01_MARK_COPY\}<\/p>/)
  // No leftover counts at all; sold out only from live inventory at zero, as "<name> sold out".
  assert.doesNotMatch(drop, /of \{drop\.piecesPerStyle\} left|left in|`\$\{left\} left`|Numbered 1–|SOLD OUT/)
  assert.match(drop, /const soldOut = released && numbered && drop\.inventoryAvailable && style\?\.remaining === 0/)
  assert.match(drop, /\{item\.name\} sold out/)
  assert.match(drop, /\{style\.name\} sold out/)
  assert.match(read('app/drop/01/page.js'), /DROP01_NUMBERED_CLAIM_LIVE \? ` \$\{DROP01_CAP_COPY\}` : ''/)
  assert.match(read('app/cart/CartClient.js'), /isDrop01NumberedLine\(item\) && <div[^>]*>\{drop01CartNote\(\)\}/)
  assert.match(read('app/checkout/CheckoutClient.js'), /hadNumbered && DROP01_NUMBERED_CLAIM_LIVE && <p[^>]*>\{DROP01_CAP_COPY\} \{DROP01_MARK_COPY\}/)
  assert.doesNotMatch(read('app/drop/01/page.js'), /Hoodie/)
  const pdp = read('app/product/[slug]/ProductClient.js')
  assert.match(pdp, /DROP01_NUMBERED_CLAIM_LIVE && <p className="pdp-drop">\{DROP01_CAP_COPY\} \{DROP01_MARK_COPY\}<\/p>/)
  assert.match(pdp, /!drop && <BackInStockSignup/)
  assert.doesNotMatch(read('app/qa/QAClient.js'), /Most popular items restock/)
  // Legal-approved restock line (same as PR #97, character for character; approved by Ashly Nov 20).
  assert.ok(read('app/qa/QAClient.js').includes("a: 'Numbered Drop 01 pieces are never restocked or re-run. For other pieces, you can sign up on the product page to get an email if an item comes back in stock.' },"))
  // Old wording Legal rejected stays out of the app.
  for (const f of ['app/drop/DropClient.js', 'app/drop/01/page.js', 'app/lib/drops.js', 'app/product/[slug]/ProductClient.js', 'app/ambassador/AmbassadorClient.js'])
    assert.doesNotMatch(read(f), /50 numbered pieces|pieces per style|Every piece is numbered|each numbered 1–50|Numbered 1–50/)
  for (const f of ['app/page.js', 'app/components/HomeDrop.js', 'app/lib/drop-copy.mjs', 'app/qa/QAClient.js', 'app/drop/DropClient.js'])
    assert.doesNotMatch(read(f), /always sell out/i)
  assert.doesNotMatch(read('app/lookbook/page.js'), /VOL 01 Hoodie/)
  assert.doesNotMatch(read('app/ambassador/AmbassadorClient.js'), /VOL 01 hoodie/i)
})
