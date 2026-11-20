/**
 * Admin-only, manual Printful hand-off for made-to-order (POD) orders. Creates a Printful DRAFT order only:
 * Printful charges when an order is confirmed, and this code never confirms (no ?confirm=true, no
 * POST /orders/{id}/confirm). An admin reviews and confirms inside Printful's dashboard.
 * Auto-submit stays off: nothing calls this except POST /api/admin/printful-draft.
 *
 * Credential: env PRINTFUL_API_KEY (name only; never logged). Missing key -> 503 'not_configured', no I/O.
 * Dependencies are injected so tests run without network, Stripe or Supabase.
 */
import {
  podDraftEligibility, podLinesFromItems, podVariantFor, podRecipientFromSession, buildPodDraftPayload, podExternalId,
} from './pod.mjs'

export const PRINTFUL_API = 'https://api.printful.com'
export const PRINTFUL_KEY_ENV = 'PRINTFUL_API_KEY'

export function printfulKeyConfigured(env = process.env) {
  return !!(env && String(env[PRINTFUL_KEY_ENV] || '').trim())
}

async function pf(fetchImpl, env, path, init = {}) {
  if (/confirm/i.test(path)) throw new Error('Refusing to call a Printful confirm endpoint')
  const res = await fetchImpl(`${PRINTFUL_API}${path}`, {
    ...init,
    headers: {
      Authorization: ['Bearer', String(env[PRINTFUL_KEY_ENV]).trim()].join(' '),
      'Content-Type': 'application/json',
      ...(env.PRINTFUL_STORE_ID ? { 'X-PF-Store-Id': env.PRINTFUL_STORE_ID } : {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`Printful ${init.method || 'GET'} ${path.split('?')[0]} -> ${res.status}: ${body?.error?.message || 'error'}`)
    err.status = res.status
    throw err
  }
  return body.result
}

/**
 * @param {object} deps { supabase, stripe, fetch, env }
 * @returns {{ ok: boolean, status: number, error?: string, printfulOrderId?: number, printfulStatus?: string, phoneSent?: boolean }}
 */
export async function createPodDraftForOrder(orderId, { supabase, stripe, fetch: fetchImpl = globalThis.fetch, env = process.env } = {}) {
  if (!printfulKeyConfigured(env)) {
    return { ok: false, status: 503, error: 'not_configured', message: `Printful isn't connected yet (${PRINTFUL_KEY_ENV} is not set). Nothing was sent.` }
  }
  if (!orderId) return { ok: false, status: 400, error: 'Missing order id' }

  const { data: order, error } = await supabase.from('orders')
    .select('id, status, items, stripe_session_id, printful_order_id, fulfillment_status')
    .eq('id', orderId).maybeSingle()
  if (error) return { ok: false, status: 500, error: `load order: ${error.message}` }
  const elig = podDraftEligibility(order)
  if (!elig.ok) return { ok: false, status: 409, error: elig.reason }

  const { data: refunds } = await supabase.from('order_refunds').select('id').eq('order_id', order.id)
  if (Array.isArray(refunds) && refunds.length) return { ok: false, status: 409, error: 'This order has a refund on it. Check it by hand before sending to Printful.' }

  // Variants come from the products table (server-side), never from the stored cart line.
  const lines = podLinesFromItems(order.items)
  const ids = [...new Set(lines.map(l => Number(l.id)).filter(Number.isFinite))]
  const { data: products, error: pErr } = await supabase.from('products')
    .select('id, name, fulfillment, numbered, printful_variants').in('id', ids)
  if (pErr) return { ok: false, status: 500, error: `load products: ${pErr.message}` }
  const byId = new Map((products || []).map(p => [Number(p.id), p]))
  const mapped = [], unmapped = []
  for (const item of lines) {
    const variant = podVariantFor(byId.get(Number(item.id)), item.size)
    if (variant) mapped.push({ item, variant }); else unmapped.push(`${item.name || item.id} (${item.size || '-'})`)
  }
  if (unmapped.length) return { ok: false, status: 409, error: `No Printful variant set for: ${unmapped.join(', ')}` }

  if (!order.stripe_session_id) return { ok: false, status: 409, error: 'No Stripe session on this order.' }
  const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
  const recipient = podRecipientFromSession(session)
  if (!recipient) return { ok: false, status: 409, error: 'No shipping address on the Stripe session.' }

  // Claim the row so a double click can't create two drafts.
  const { data: claimed, error: cErr } = await supabase.from('orders')
    .update({ fulfillment_status: 'printful_submitting', printful_claimed_at: new Date().toISOString(), printful_error: null })
    .eq('id', order.id).is('printful_order_id', null)
    .select('id')
  if (cErr) return { ok: false, status: 500, error: `claim: ${cErr.message}` }
  if (!claimed?.length) return { ok: false, status: 409, error: 'Another request is already handling this order.' }

  try {
    let pfOrder = null
    try { pfOrder = await pf(fetchImpl, env, `/orders/@${encodeURIComponent(podExternalId(order.id))}`) } catch (e) { if (e.status !== 404) throw e }
    if (!pfOrder) {
      const payload = buildPodDraftPayload({ orderId: order.id, recipient, lines: mapped })
      pfOrder = await pf(fetchImpl, env, '/orders', { method: 'POST', body: JSON.stringify(payload) }) // draft: no confirm
    }
    await supabase.from('orders').update({
      printful_order_id: pfOrder.id,
      printful_status: pfOrder.status || 'draft',
      fulfillment_status: 'printful_draft',
    }).eq('id', order.id)
    return { ok: true, status: 200, printfulOrderId: pfOrder.id, printfulStatus: pfOrder.status || 'draft', phoneSent: !!recipient.phone }
  } catch (err) {
    const msg = String(err.message).slice(0, 500)
    await supabase.from('orders').update({ fulfillment_status: 'printful_failed', printful_error: msg })
      .eq('id', order.id).is('printful_order_id', null)
    return { ok: false, status: 502, error: msg }
  }
}
