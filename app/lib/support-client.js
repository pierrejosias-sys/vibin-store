'use client'
// Browser side of support intake: remembers the customer's own thread (ticket + email + token).
const KEY = 'vibin_support_thread'

export const TOPIC_OPTIONS = [
  ['order', 'My order'], ['sizing', 'Sizing'], ['shipping', 'Shipping'],
  ['returns', 'Returns & exchanges'], ['pre-order', 'Drop 01 pre-order'], ['other', 'Something else'],
]

export function getSavedThread() {
  try {
    const t = JSON.parse(localStorage.getItem(KEY) || 'null')
    return t?.ticket && t?.email && t?.token ? t : null
  } catch { return null }
}
export function saveThread({ ticket, email, token }) {
  try { localStorage.setItem(KEY, JSON.stringify({ ticket, email, token })) } catch {}
  try { window.dispatchEvent(new Event('vibin-support-thread')) } catch {}
}
export function forgetThread() {
  try { localStorage.removeItem(KEY) } catch {}
}

async function call(url, opts) {
  const res = await fetch(url, { cache: 'no-store', ...opts })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong.'), { status: res.status })
  return data
}
export function createTicket(fields) {
  return call('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) })
}
export function sendFollowUp(thread, message, website = '') {
  return call('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...thread, message, website }) })
}
export function fetchThread({ ticket, email, token }) {
  return call(`/api/support?${new URLSearchParams({ ticket, email, token })}`)
}
