import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import {
  TOPICS, validateTicket, validateReply, isBot, newAccessToken, hashToken, tokenMatches, newTicketCode,
  createRateLimiter, statusAfterMessage, publicThread, normalizeEmail,
} from '../app/lib/support.mjs'

const good = { email: ' Jo@Example.com ', topic: 'pre-order', message: 'When does the hoodie ship?', orderNumber: '#1042', name: 'Jo' }

test('topics are exactly the six intake topics', () => {
  assert.deepEqual(TOPICS, ['order', 'sizing', 'shipping', 'returns', 'pre-order', 'other'])
})

test('validateTicket normalizes and accepts a good ticket', () => {
  const v = validateTicket(good)
  assert.equal(v.ok, true)
  assert.deepEqual(v.value, { email: 'jo@example.com', topic: 'pre-order', message: 'When does the hoodie ship?', orderNumber: '1042', name: 'Jo' })
  assert.equal(validateTicket({ ...good, orderNumber: '' }).value.orderNumber, null)
})

test('validateTicket rejects bad email/topic/message/order', () => {
  assert.equal(validateTicket({ ...good, email: 'nope' }).ok, false)
  assert.equal(validateTicket({ ...good, topic: 'refund-now' }).ok, false)
  assert.equal(validateTicket({ ...good, topic: undefined }).ok, false)
  assert.equal(validateTicket({ ...good, message: ' ' }).ok, false)
  assert.equal(validateTicket({ ...good, message: 'x'.repeat(4001) }).ok, false)
  assert.equal(validateTicket({ ...good, orderNumber: "1; drop table" }).ok, false)
  assert.equal(validateTicket(undefined).ok, false)
})

test('control characters are stripped', () => {
  assert.equal(validateTicket({ ...good, message: 'hi\u0000 there\u0007' }).value.message, 'hi there')
})

test('validateReply', () => {
  assert.equal(validateReply({ message: 'ok' }).ok, true)
  assert.equal(validateReply({ message: '' }).ok, false)
  assert.equal(validateReply({ message: 'x'.repeat(4001) }).ok, false)
})

test('honeypot', () => {
  assert.equal(isBot({ website: 'http://spam' }), true)
  assert.equal(isBot({ website: '' }), false)
  assert.equal(isBot({}), false)
})

test('tokens: random, hashed, constant-time match, rejects junk', () => {
  const t = newAccessToken(), h = hashToken(t)
  assert.notEqual(t, newAccessToken())
  assert.equal(h.length, 64)
  assert.ok(!h.includes(t))
  assert.equal(tokenMatches(t, h), true)
  assert.equal(tokenMatches(newAccessToken(), h), false)
  for (const bad of [null, '', 'short', 'x'.repeat(65), 123]) assert.equal(tokenMatches(bad, h), false)
  assert.equal(tokenMatches(t, null), false)
})

test('ticket codes look like VB-XXXXXX and vary', () => {
  const a = newTicketCode()
  assert.match(a, /^VB-[A-Z2-9]{6}$/)
  assert.ok(new Set(Array.from({ length: 50 }, newTicketCode)).size > 45)
})

test('rate limiter allows max per window then blocks, per key', () => {
  const hit = createRateLimiter({ max: 3, windowMs: 1000 })
  assert.deepEqual([hit('a', 0), hit('a', 1), hit('a', 2), hit('a', 3)], [true, true, true, false])
  assert.equal(hit('b', 3), true)
  assert.equal(hit('a', 1001), true)
})

test('status flow: customer -> open, agent -> answered', () => {
  assert.equal(statusAfterMessage('customer'), 'open')
  assert.equal(statusAfterMessage('agent'), 'answered')
})

test('publicThread exposes no internal ids, emails or token hash', () => {
  const chat = { id: 'uuid-1', chat_id: 'VB-ABC234', email: 'jo@example.com', status: 'answered', topic: 'order', order_number: '5', access_token_hash: 'f'.repeat(64), created_at: 'x' }
  const out = publicThread(chat, [{ sender: 'customer', sender_email: 'jo@example.com', message: 'hi', created_at: 1 }, { sender: 'agent', sender_email: 'agent@vibinapparel.com', message: 'hello', created_at: 2 }])
  const s = JSON.stringify(out)
  for (const leak of ['uuid-1', 'access_token_hash', 'f'.repeat(64), 'agent@vibinapparel.com', 'jo@example.com']) assert.ok(!s.includes(leak), leak)
  assert.deepEqual(out.messages.map(m => m.from), ['you', 'agent'])
})

test('normalizeEmail', () => {
  assert.equal(normalizeEmail('A@B.co'), 'a@b.co')
  assert.equal(normalizeEmail('a@b'), null)
})

const sql = readFileSync('supabase/migrations/20261023000009_support_intake.sql', 'utf8')
test('migration: no anon access, no always-true policies, status/topic checks, service-role-only queue', () => {
  assert.match(sql, /DROP POLICY IF EXISTS "Anyone can create chat"/)
  assert.match(sql, /DROP POLICY IF EXISTS "Anyone can send message"/)
  assert.match(sql, /REVOKE ALL ON public\.support_chats FROM anon/)
  assert.match(sql, /REVOKE ALL ON public\.support_messages FROM anon/)
  assert.ok(!/USING \(true\)|WITH CHECK \(true\)/i.test(sql))
  assert.match(sql, /CHECK \(status IN \('open', 'answered', 'closed'\)\)/)
  assert.match(sql, /'order', 'sizing', 'shipping', 'returns', 'pre-order', 'other'/)
  assert.match(sql, /CREATE OR REPLACE VIEW public\.support_queue_open\s+WITH \(security_invoker = true\)/)
  assert.match(sql, /REVOKE ALL ON public\.support_queue_open FROM PUBLIC, anon, authenticated/)
  assert.match(sql, /GRANT SELECT ON public\.support_queue_open TO service_role/)
})

test('broken SupporChat (user_id column) is gone; widget uses the server route only', () => {
  assert.equal(existsSync('app/components/SupporChat.js'), false)
  const w = readFileSync('app/components/SupportChat.js', 'utf8') + readFileSync('app/lib/support-client.js', 'utf8')
  assert.ok(!/user_id|createBrowserClient|from\('support_/.test(w))
  assert.match(w, /\/api\/support/)
  const contact = readFileSync('app/contact/ContactClient.js', 'utf8')
  assert.match(contact, /createTicket/)
  assert.ok(!/mailto:\$\{CONTACT_EMAIL\}\?subject/.test(contact))
})
