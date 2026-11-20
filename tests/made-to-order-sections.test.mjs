import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = p => readFileSync(join(root, p), 'utf8')

// Must match app/lib/pod.mjs on the POD branch (PR #96): POD_SHIP_TIME_COPY, POD_SEPARATE_PACKAGE_COPY,
// POD_FREE_SHIPPING_EXCLUSION_COPY (with $125 from FREE_SHIPPING_LABEL), and Legal's terms §5 sentence.
const SHIP = 'Made to order. Ships within 7 business days of your order. US delivery usually takes another 3–4 business days after it ships.'
const HATS = 'Hats ship in a separate package.'
const RETURNS = 'Made-to-order pieces are final sale except as stated in the return terms on their product page.'

test('/shipping has a Made-to-order items section with the exact lines', () => {
  const s = read('app/shipping/ShippingClient.js')
  assert.match(s, /<h3[^>]*>Made-to-order items<\/h3>/)
  for (const line of [SHIP, HATS, RETURNS]) assert.ok(s.includes(line), line)
  assert.ok(s.includes("Made-to-order pieces don&apos;t count toward free shipping on orders over {FREE_SHIPPING_LABEL}. Their shipping is added at checkout."))
})

test('/qa has a made-to-order answer with the exact lines', () => {
  const s = read('app/qa/QAClient.js')
  assert.match(s, /q: 'How do made-to-order items work\?'/)
  for (const line of [SHIP, HATS, RETURNS]) assert.ok(s.includes(line), line)
  assert.ok(s.includes("Made-to-order pieces don't count toward free shipping on orders over ${FREE_SHIPPING_LABEL}. Their shipping is added at checkout."))
  for (const w of ['christmas', 'holiday', 'arrives by']) assert.ok(!s.toLowerCase().includes(w))
})
