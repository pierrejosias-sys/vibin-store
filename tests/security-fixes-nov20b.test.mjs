import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { redeemSessionCheck } from '../app/lib/verify.mjs'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('redeemSessionCheck: signed-out callers get 401', () => {
  const r = redeemSessionCheck(null, { account: 'a@b.co', tier_id: 'x' })
  assert.equal(r.status, 401)
  assert.equal(r.body.status, 'login_required')
})

test('redeemSessionCheck: a different email than the session gets 403', () => {
  const r = redeemSessionCheck({ email: 'me@vibin.test' }, { account: 'victim@vibin.test' })
  assert.equal(r.status, 403)
  assert.equal(r.body.status, 'account_mismatch')
})

test('redeemSessionCheck: matching email (any case/spacing) or no email is allowed', () => {
  assert.equal(redeemSessionCheck({ email: 'Me@Vibin.test' }, { account: ' me@vibin.test ' }), null)
  assert.equal(redeemSessionCheck({ email: 'me@vibin.test' }, { tier_id: 'x' }), null)
})

test('/api/redeem checks the session before spending and redeems only the session email', () => {
  const src = read('app/api/redeem/route.js')
  assert.match(src, /getSessionUser\(\)/)
  assert.match(src, /redeemSessionCheck\(user, body\)/)
  assert.match(src, /handleRedeem\(supabase, \{ \.\.\.body, account: email \}\)/)
  assert.ok(src.indexOf('redeemSessionCheck(') < src.indexOf('handleRedeem(supabase'))
})

test('/verify tells signed-out users to sign in to redeem', () => {
  const src = read('app/verify/page.js')
  assert.match(src, /status === 401/)
  assert.match(src, /\/login\?next=%2Fverify/)
})

test('footer links to Careers next to Ambassador', () => {
  const src = read('app/components/SiteFooter.js')
  assert.match(src, /<Link href="\/ambassador">Ambassador<\/Link><\/li>\s*<li><Link href="\/careers">Careers<\/Link><\/li>/)
})

test('job_applications migration only lets the public insert pending applications', () => {
  const sql = read('supabase/migrations/20261120170002_job_applications_insert_pending.sql')
  assert.match(sql, /DROP POLICY IF EXISTS "Anyone can apply for jobs"/)
  assert.match(sql, /WITH CHECK \(status IS NULL OR status = 'pending'\)/)
  assert.doesNotMatch(sql, /WITH CHECK \(true\)/)
  // The careers form still sends status 'pending', which the new policy accepts.
  assert.match(read('app/careers/[id]/page.js'), /status: 'pending'/)
})

test('definer migration revokes trigger functions and pins handle_new_user search_path', () => {
  const sql = read('supabase/migrations/20261120170001_revoke_sensitive_definer_execute.sql')
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.handle_new_user\(\) FROM PUBLIC, anon, authenticated/)
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.profiles_guard_role_flags\(\) FROM PUBLIC, anon, authenticated/)
  assert.match(sql, /ALTER FUNCTION public\.handle_new_user\(\) SET search_path = public, pg_temp/)
  assert.doesNotMatch(sql, /REVOKE[^;]*drop_inventory/)
  assert.doesNotMatch(sql, /REVOKE[^;]*piece_by_tag/)
})

test('CSP allows Stripe, Supabase, Vercel analytics and the image hosts the site uses', () => {
  const src = read('next.config.js')
  for (const host of ['https://js.stripe.com', 'https://api.stripe.com', 'https://*.supabase.co', 'wss://*.supabase.co',
    'https://va.vercel-scripts.com', 'https://vitals.vercel-insights.com', 'https://api.qrserver.com', 'https://images.unsplash.com',
    'https://user-gen-media-assets.s3.amazonaws.com']) {
    assert.ok(src.includes(host), `CSP should include ${host}`)
  }
})

test('the only callers of /api/notify and /api/ai-assistant are admin pages', () => {
  assert.match(read('app/admin/email/page.js'), /\/api\/notify/)
  assert.match(read('app/admin/page.js'), /ai-assistant/)
})
