// Footer copy (Vibin is a USA brand, EST. 2019) and header icons (line SVGs, never emoji).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('footer tagline is the USA wording with EST. 2019', () => {
  const footer = read('app/components/SiteFooter.js')
  assert.ok(footer.includes('A lifestyle streetwear brand. EST. 2019. A subsidiary of HVD Holdings. Apparel for those who move different.'))
  assert.ok(!/based in Jacksonville/.test(footer))
})

test('header icons are line SVGs, not emoji', () => {
  const header = read('app/components/SiteHeader.js')
  assert.ok(!/[🔍👤🛒☰✕]/u.test(header))
  for (const name of ['SearchIcon', 'AccountIcon', 'BagIcon', 'MenuIcon', 'CloseIcon']) assert.ok(header.includes(`<${name} />`), name)
  assert.ok(header.includes("stroke: 'currentColor'"))
})
