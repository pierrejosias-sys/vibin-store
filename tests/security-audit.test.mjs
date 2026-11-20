import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { siteOrigin, allowedOrigins, DEFAULT_SITE_ORIGIN } from '../app/lib/site-origin.mjs'
import { escapeHtml } from '../app/lib/html.mjs'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('next.config.js sends CSP and the baseline security headers', () => {
  const src = read('next.config.js')
  assert.match(src, /Content-Security-Policy/)
  assert.match(src, /frame-ancestors 'none'/)
  assert.match(src, /X-Content-Type-Options/)
  assert.match(src, /nosniff/)
  assert.match(src, /Referrer-Policy/)
  assert.match(src, /X-Frame-Options/)
  assert.match(src, /Permissions-Policy/)
})

test('security.txt exists, names a contact, and has a future Expires', () => {
  const path = new URL('../public/.well-known/security.txt', import.meta.url)
  assert.equal(existsSync(path), true)
  const txt = readFileSync(path, 'utf8')
  assert.match(txt, /^Contact: mailto:hello@vibinapparel\.com$/m)
  assert.match(txt, /^Canonical: https:\/\/vibinapparel\.com\/\.well-known\/security\.txt$/m)
  const exp = txt.match(/^Expires: (\S+)/m)
  assert.ok(exp, 'Expires is required by RFC 9116')
  assert.ok(new Date(exp[1]) > new Date('2026-11-20T00:00:00Z'))
})

test('siteOrigin rejects a foreign Origin header', () => {
  const spoof = { headers: { get: k => k === 'origin' ? 'https://evil.example' : null } }
  assert.equal(siteOrigin(spoof, {}), DEFAULT_SITE_ORIGIN)
  const ok = { headers: { get: k => k === 'origin' ? 'https://vibinapparel.com' : null } }
  assert.equal(siteOrigin(ok, {}), 'https://vibinapparel.com')
  const preview = { headers: { get: k => k === 'origin' ? 'https://vibin-store-abc.vercel.app' : null } }
  assert.equal(siteOrigin(preview, { VERCEL_URL: 'vibin-store-abc.vercel.app' }), 'https://vibin-store-abc.vercel.app')
  assert.equal(siteOrigin(preview, {}), DEFAULT_SITE_ORIGIN)
  assert.equal(allowedOrigins({}).has('https://www.vibinapparel.com'), true)
})

test('checkout uses siteOrigin, not the raw Origin header', () => {
  const src = read('app/api/checkout/route.js')
  assert.match(src, /import \{ siteOrigin \} from '..\/..\/lib\/site-origin.mjs'/)
  assert.match(src, /success_url: `\$\{siteOrigin\(request\)\}\/checkout/)
  assert.match(src, /cancel_url: `\$\{siteOrigin\(request\)\}\/cart`/)
  assert.doesNotMatch(src, /request\.headers\.get\('origin'\)/)
})

test('/api/notify and /api/ai-assistant require an admin session', () => {
  const notify = read('app/api/notify/route.js')
  const assistant = read('app/api/ai-assistant/route.js')
  assert.match(notify, /if \(!\(await requireAdmin\(\)\)\) return forbidden\(\)/)
  assert.match(assistant, /if \(!\(await requireAdmin\(\)\)\) return forbidden\(\)/)
  assert.doesNotMatch(notify, /detail: err/)
})

test('escapeHtml encodes markup characters', () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;')
  assert.equal(escapeHtml("a&b\"c'd"), 'a&amp;b&quot;c&#39;d')
})

test('middleware treats /support-agent as an admin route', () => {
  const src = read('middleware.js')
  assert.match(src, /\/support-agent/)
  assert.match(src, /adminRoutes = \['\/admin', '\/support-agent'\]/)
  assert.match(src, /'\/support-agent\/:path\*'/)
})

test('public write routes rate-limit by IP', () => {
  const files = [
    'app/api/waitlist/route.js',
    'app/api/back-in-stock/route.js',
    'app/api/mailchimp/route.js',
    'app/api/mailchimp/unsubscribe/route.js',
    'app/api/ambassador/apply/route.js',
    'app/api/ambassador/check-email/route.js',
    'app/api/ambassador/code/route.js',
  ]
  for (const f of files) {
    const src = read(f)
    assert.match(src, /createRateLimiter/, `${f} should create a limiter`)
    assert.match(src, /ipLimit\(clientIp\(request\)\)/, `${f} should check the client IP`)
    assert.match(src, /status: 429/, `${f} should return 429`)
  }
})
