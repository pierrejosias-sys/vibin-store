// Phone layout guards (Nov 19, 2026): the Shop page ran wider than a 390px screen because the
// Coming soon email form set a min-content width that 1fr grid columns had to honor.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('phone grids use minmax(0, 1fr) so no tile can push the page wider than the screen', () => {
  const chrome = read('app/site-chrome.css')
  assert.match(chrome, /\.sp-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(chrome, /\.srch-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(chrome, /\.sp-card \{ display: block; min-width: 0;/)
  assert.match(chrome, /\.sp-chips \{ flex-wrap: wrap; overflow-x: visible; \}/)
  const styles = read('app/styles.css')
  assert.match(styles, /\.products \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  // No phone rule left with a bare repeat(2, 1fr) on a product grid
  for (const css of [chrome, styles]) {
    for (const cls of ['sp-grid', 'srch-grid', 'products', 'related-grid']) {
      assert.doesNotMatch(css, new RegExp(`\\.${cls} \\{ grid-template-columns: repeat\\(2, 1fr\\)`), cls)
    }
  }
})

test('Coming soon email form wraps instead of widening its card', () => {
  const src = read('app/components/ComingSoonSignup.js')
  assert.match(src, /display: 'flex', flexWrap: 'wrap'/)
  assert.match(src, /flex: '1 1 120px', width: '100%', minWidth: 0/)
})

test('photo boxes keep their height on browsers without aspect-ratio', () => {
  assert.match(read('app/site-chrome.css'), /@supports not \(aspect-ratio: 1 \/ 1\) \{ \.pt \{ height: 0; padding-top: 133\.333%; \}/)
})

test('home tiles fall back to the product gallery image (lanyard mockups)', () => {
  const home = read('app/page.js')
  assert.match(home, /const cover = stored \? null : coverImage\(p\)/)
  assert.match(home, /src=\{stored \|\| cover\?\.src \|\| null\}/)
})
