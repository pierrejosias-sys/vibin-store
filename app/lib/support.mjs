/**
 * Support intake — pure helpers (unit-tested in tests/support.test.mjs).
 * Used by /api/support (customer) and /api/admin/support (agents).
 */
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'

export const TOPICS = ['order', 'sizing', 'shipping', 'returns', 'pre-order', 'other']
export const STATUSES = ['open', 'answered', 'closed']
export const LIMITS = { name: 80, email: 254, order: 40, message: 4000, minMessage: 2 }
/** Max customer messages per email (and per IP) in RATE_WINDOW_MS. */
export const RATE_MAX = 5
export const RATE_WINDOW_MS = 10 * 60 * 1000

export function normalizeEmail(e) {
  const s = String(e ?? '').trim().toLowerCase()
  return s.length <= LIMITS.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? s : null
}

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max)

/** Honeypot: real users never fill the hidden "website" field. */
export function isBot(body) {
  return !!(body && typeof body.website === 'string' && body.website.trim() !== '')
}

/** Validates a new ticket. Returns { ok, value } or { ok:false, error }. */
export function validateTicket(body = {}) {
  const email = normalizeEmail(body.email)
  if (!email) return { ok: false, error: 'Enter a valid email.' }
  const topic = TOPICS.includes(body.topic) ? body.topic : null
  if (!topic) return { ok: false, error: 'Choose a topic.' }
  const message = clean(body.message, LIMITS.message + 1)
  if (message.length < LIMITS.minMessage) return { ok: false, error: 'Write a short message.' }
  if (message.length > LIMITS.message) return { ok: false, error: `Message is too long (max ${LIMITS.message} characters).` }
  const orderNumber = clean(body.orderNumber, LIMITS.order).replace(/^#/, '')
  if (orderNumber && !/^[A-Za-z0-9-]{1,40}$/.test(orderNumber)) return { ok: false, error: 'Order number can only contain letters, numbers and dashes.' }
  return { ok: true, value: { email, topic, message, orderNumber: orderNumber || null, name: clean(body.name, LIMITS.name) || null } }
}

/** Validates a follow-up message on an existing thread. */
export function validateReply(body = {}) {
  const message = clean(body.message, LIMITS.message + 1)
  if (message.length < 1) return { ok: false, error: 'Write a message.' }
  if (message.length > LIMITS.message) return { ok: false, error: `Message is too long (max ${LIMITS.message} characters).` }
  return { ok: true, value: { message } }
}

export function newAccessToken() {
  return randomBytes(24).toString('base64url')
}
export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex')
}
/** Constant-time check of a presented token against the stored hash. */
export function tokenMatches(token, storedHash) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,64}$/.test(token) || typeof storedHash !== 'string' || storedHash.length !== 64) return false
  return timingSafeEqual(Buffer.from(hashToken(token), 'hex'), Buffer.from(storedHash, 'hex'))
}

/** Customer-facing ticket number, e.g. VB-7K3QX9. */
export function newTicketCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const b = randomBytes(6)
  return 'VB-' + Array.from(b, x => A[x % A.length]).join('')
}

/** In-memory sliding-window limiter (per server instance; the DB check is the durable one). */
export function createRateLimiter({ max = RATE_MAX, windowMs = RATE_WINDOW_MS } = {}) {
  const hits = new Map()
  return function hit(key, now = Date.now()) {
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs)
    if (arr.length >= max) { hits.set(key, arr); return false }
    arr.push(now); hits.set(key, arr)
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] >= windowMs) hits.delete(k)
    return true
  }
}

/** Status after a message: customer -> open (needs an answer), agent -> answered. */
export function statusAfterMessage(sender) {
  return sender === 'agent' ? 'answered' : 'open'
}

/** What a customer may see of a thread (no internal ids/hashes). */
export function publicThread(chat, messages = []) {
  return {
    ticket: chat.chat_id,
    status: chat.status,
    topic: chat.topic,
    orderNumber: chat.order_number,
    createdAt: chat.created_at,
    messages: messages.map(m => ({ from: m.sender === 'agent' ? 'agent' : m.sender === 'system' ? 'system' : 'you', message: m.message, at: m.created_at })),
  }
}
