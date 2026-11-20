import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DROP_01, DROP01_SHIP_LINE_PREWINDOW } from '../app/lib/drop-public.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = p => readFileSync(join(root, p), 'utf8')

// Legal ruling, /workspace/legal/site-copy-conflicts-nov20.md (Nov 20, 12:23 PM ET). Pending Josias's yes to deploy.
test('removed phrases are gone (shipping times, free returns, account returns, 24 hours, Feb 12)', () => {
  const shipping = read('app/shipping/ShippingClient.js') + read('app/shipping/page.js')
  assert.doesNotMatch(shipping, /1–2 business days|1-2 business days|5–8 business days|5-8 business days|1–3|process in/)
  const qa = read('app/qa/QAClient.js')
  assert.doesNotMatch(qa, /free returns/i)
  assert.doesNotMatch(qa, /Start a return from your account/)
  assert.doesNotMatch(qa, /within 24 hours/)
  const returns = read('app/returns/ReturnsClient.js') + read('app/returns/page.js')
  assert.doesNotMatch(returns, /Easy 30-day returns and exchanges on all Vibin Apparel SS26 orders/)
  assert.doesNotMatch(returns, /within 24 hours/)
  for (const f of ['app/drop/DropClient.js', 'app/lib/drop-public.mjs', 'app/shipping/ShippingClient.js']) assert.doesNotMatch(read(f), /Feb(ruary)? 12/)
  assert.equal(DROP_01.shipsBy, null) // date display unchanged from main: no ship-by date posted
})

test('Legal replacement text is verbatim', () => {
  const sc = read('app/shipping/ShippingClient.js')
  assert.match(sc, /<td style=\{\{padding:'16px 0'\}\}>Shown on each product page<\/td>/)
  assert.match(sc, /Each product page shows when that item ships\. Made-to-order pieces ship within 7 business days of your order\. Drop 01 is a pre-order, and its ship-by date is shown on the Drop 01 page and at checkout before you pay\. You&apos;ll get a tracking number by email once your order ships\./)
  assert.match(read('app/shipping/page.js'), /description: `Vibin Apparel ships to the US only\. Each product page shows when that item ships\. Free shipping on orders over \$\{FREE_SHIPPING_LABEL\}\.`/)
  assert.equal(DROP01_SHIP_LINE_PREWINDOW, "Drop 01 is a pre-order. Pieces are made after the pre-order window closes. The ship-by date will be posted here before pre-orders open, and you'll see it again at checkout before you pay.")
  assert.match(read('app/drop/DropClient.js'), /\{!drop\.shipsBy && drop\.id === DROP_01\.id && <p[^>]*>\{DROP01_SHIP_LINE_PREWINDOW\}<\/p>\}/)
  const qa = read('app/qa/QAClient.js')
  assert.ok(qa.includes('We accept returns within 30 days of delivery on unworn, unwashed items with tags attached. Return shipping is paid by the customer unless the item is defective or we sent the wrong item. Made-to-order pieces follow the return terms on their product page. To start a return, email returns@vibinapparel.com with your order number.'))
  assert.ok(qa.includes('Numbered Drop 01 pieces are never restocked or re-run. For other pieces, you can sign up on the product page to get an email if an item comes back in stock.'))
  assert.ok(qa.includes('We typically respond within 1 business day.'))
  assert.ok(read('app/returns/ReturnsClient.js').includes('Return any unused item within 30 days of delivery for a full refund or exchange. Made-to-order pieces follow the return terms shown on their product page.'))
  assert.ok(read('app/returns/page.js').includes('30-day returns and exchanges on most Vibin Apparel orders. Made-to-order pieces follow the terms on their product page.'))
})
