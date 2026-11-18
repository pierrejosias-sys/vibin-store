/**
 * "Notify me when back in stock" (server only, service-role Supabase client).
 * Table: back_in_stock_signups. Separate from the Drop 01 waitlist (waitlist_signups); never mixed.
 *
 * Sending is NOT switched on yet: getBackInStockSender() returns null until an email provider is
 * wired in, and notifyBackInStock() then does nothing. Sign-ups are stored either way.
 * Privacy: no customer email is ever written to logs from here.
 */
import { normalizeEmail } from './early-access.mjs'
import { offersBackInStock } from './back-in-stock-rules.mjs'

const SIZE_RE = /^[A-Z0-9]{1,6}$/          // XS, S, M, XL, XXL, 3X, OS, 32 ...
const MAX_COLOR = 40
export const CLAIM_TTL_MS = 10 * 60 * 1000 // a send that hasn't finished in 10 min can be retried

export { offersBackInStock }

/** Validates the browser's body. Returns { value } or { error } (message safe to show). */
export function parseSignup(body) {
  const email = normalizeEmail(body?.email)
  if (!email) return { error: 'Enter a valid email.' }
  const productId = Number(body?.productId)
  if (!Number.isSafeInteger(productId) || productId <= 0) return { error: 'Unknown product.' }
  const rawSize = typeof body?.size === 'string' ? body.size.trim().toUpperCase() : ''
  if (rawSize && !SIZE_RE.test(rawSize)) return { error: 'Pick a size.' }
  const color = typeof body?.color === 'string' ? body.color.trim().slice(0, MAX_COLOR) : ''
  return { value: { email, productId, size: rawSize, color } }
}

/**
 * Saves one sign-up. Checks the product exists and is actually sold out or coming soon, so the
 * table only holds real interest. Signing up twice for the same product/size/colour is a no-op.
 * Returns { ok: true, already } or { ok: false, status, error }.
 */
export async function saveSignup(supabase, { email, productId, size, color }) {
  const { data: product, error: readErr } = await supabase.from('products')
    .select('id, in_stock, tags').eq('id', productId).maybeSingle()
  if (readErr) throw new Error(readErr.message)
  if (!product) return { ok: false, status: 404, error: 'Unknown product.' }
  if (!offersBackInStock(product)) return { ok: false, status: 409, error: 'Good news: this one is in stock now.' }

  const { error } = await supabase.from('back_in_stock_signups')
    .insert({ email, product_id: productId, size, color })
  if (!error) return { ok: true, already: false }
  if (error.code === '23505') return { ok: true, already: true } // unique (email, product, size, color)
  throw new Error(error.message)
}

/**
 * Admin summary: one entry per product, with a line per size/colour.
 * rows: back_in_stock_signups rows. products: [{ id, name, slug, in_stock }].
 */
export function summarizeSignups(rows, products = []) {
  const byId = new Map(products.map(p => [p.id, p]))
  const groups = new Map()
  for (const r of rows || []) {
    const p = byId.get(r.product_id)
    if (!groups.has(r.product_id)) {
      groups.set(r.product_id, {
        productId: r.product_id,
        name: p?.name || `Product #${r.product_id}`,
        slug: p?.slug || null,
        inStock: p ? p.in_stock !== false : null,
        waiting: 0, notified: 0, variants: new Map(), signups: [],
      })
    }
    const g = groups.get(r.product_id)
    const key = `${r.size || ''}|${r.color || ''}`
    if (!g.variants.has(key)) g.variants.set(key, { size: r.size || '', color: r.color || '', waiting: 0, notified: 0 })
    const v = g.variants.get(key)
    if (r.notified_at) { g.notified++; v.notified++ } else { g.waiting++; v.waiting++ }
    g.signups.push({ id: r.id, email: r.email, size: r.size || '', color: r.color || '', createdAt: r.created_at, notifiedAt: r.notified_at || null })
  }
  return [...groups.values()]
    .map(g => ({
      ...g,
      variants: [...g.variants.values()].sort((a, b) => b.waiting - a.waiting || a.size.localeCompare(b.size)),
      signups: g.signups.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    }))
    .sort((a, b) => b.waiting - a.waiting || a.name.localeCompare(b.name))
}

/** The one back-in-stock email. No ship dates, no discounts, one recipient. */
export function backInStockEmail({ email, productName, slug, size, color }, base = 'https://vibinapparel.com') {
  const url = `${base}/product/${encodeURIComponent(slug || '')}`
  const what = [productName, color, size && size !== 'OS' ? `size ${size}` : ''].filter(Boolean).join(', ')
  return {
    to: email,
    subject: `Back in stock: ${productName}`,
    html: `<p>You asked us to tell you when it came back. It's here: <strong>${escapeHtml(what)}</strong>.</p>
<p><a href="${url}">Shop it on vibinapparel.com</a></p>
<p>This is the only email you'll get for this sign-up.</p>`,
    text: `It's back: ${what}.\nShop it: ${url}\nThis is the only email you'll get for this sign-up.`,
  }
}

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/**
 * Email sender for back-in-stock notices. STUB: returns null (sending off) until a provider is chosen
 * and its key is in Vercel. To switch on, return an async (message) => ({ ok } | { ok: false, error }).
 * Resend is already set up for this domain (see app/api/notify/route.js); Brevo is blocked on keys.
 */
export function getBackInStockSender(_env = process.env) {
  return null
}

/**
 * Sends each waiting sign-up for a product (optionally one size) its single email, then marks it
 * notified. Each row is claimed atomically before sending, so two runs can't double-send, and a
 * row with notified_at set is never picked again. Returns counts; never logs emails.
 */
export async function notifyBackInStock(supabase, product, { size = null, send = getBackInStockSender(), now = Date.now() } = {}) {
  if (!send) return { skipped: 'sending not switched on', sent: 0, failed: 0 }
  let q = supabase.from('back_in_stock_signups').select('id, email, size, color')
    .eq('product_id', product.id).is('notified_at', null)
  if (size) q = q.eq('size', size)
  const { data: rows, error } = await q
  if (error) throw new Error(error.message)

  let sent = 0, failed = 0
  const stale = new Date(now - CLAIM_TTL_MS).toISOString()
  for (const row of rows || []) {
    const { data: claimed, error: claimErr } = await supabase.from('back_in_stock_signups')
      .update({ notify_claimed_at: new Date(now).toISOString() })
      .eq('id', row.id).is('notified_at', null)
      .or(`notify_claimed_at.is.null,notify_claimed_at.lt.${stale}`)
      .select('id')
    if (claimErr || !claimed?.length) continue // someone else has it
    let res
    try {
      res = await send(backInStockEmail({ email: row.email, productName: product.name, slug: product.slug, size: row.size, color: row.color }))
    } catch (e) {
      res = { ok: false, error: String(e?.message || e) }
    }
    if (res?.ok) {
      await supabase.from('back_in_stock_signups').update({ notified_at: new Date(now).toISOString(), notify_error: null }).eq('id', row.id)
      sent++
    } else {
      // Give the claim back so a later run can retry; keep a short error (no email address in it).
      await supabase.from('back_in_stock_signups').update({ notify_claimed_at: null, notify_error: String(res?.error || 'send failed').slice(0, 200) }).eq('id', row.id)
      failed++
    }
  }
  return { sent, failed }
}
