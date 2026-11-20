import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = p => readFileSync(join(root, p), 'utf8')

// Legal (Nov 20): no "drops always sell out" and no "Most popular items restock" anywhere on the site.
// The privacy page is out of scope for this change.
test('no "always sell out" or "Most popular items restock" claims in site copy', () => {
  const walk = (dir, acc = []) => {
    for (const ent of readdirSync(join(root, dir), { withFileTypes: true })) {
      const p = join(dir, ent.name)
      if (ent.isDirectory()) { if (ent.name !== 'privacy') walk(p, acc) } else if (/\.(js|mjs|jsx)$/.test(ent.name)) acc.push(p)
    }
    return acc
  }
  for (const f of walk('app')) {
    const src = read(f)
    assert.doesNotMatch(src, /always sell(s)? out/i, f)
    assert.doesNotMatch(src, /most popular items restock/i, f)
  }
  assert.match(read('app/qa/QAClient.js'), /Numbered Drop 01 pieces are never restocked or re-run\./)
})
