/**
 * Server-only Printful fulfillment (API v1 /orders — v2 has no sync-product
 * support yet and cannot create confirmed orders in one call).
 * Docs: https://developers.printful.com/docs/  Setup: docs/printful-setup.md
 */
import {
  parseVariantMap, splitCart, recipientFromSession, buildOrderPayload,
  decideFulfillment, isConfirmEnabled, fulfillmentStatusFromPrintful, externalIdFor,
} from './printful-core.mjs'

const API = 'https://api.printful.com'

function authHeaders() {
  const credential = process.env.PRINTFUL_API_TOKEN
  if (!credential) throw new Error('PRINTFUL_API_TOKEN is not set')
  return {
    Authorization: ['Bearer', credential].join(' '),
    'Content-Type': 'application/json',
    ...(process.env.PRINTFUL_STORE_ID ? { 'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID } : {}),
  }
}

async function pf(path, init = {}) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(), ...(init.headers || {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`Printful ${init.method || 'GET'} ${path} -> ${res.status}: ${body?.error?.message || body?.result || 'error'}`)
    err.status = res.status
    throw err
  }
  return body.result
}

/** Looks up an existing Printful order by our external id (null if none). */
export async function findPrintfulOrder(orderId) {
  try { return await pf(`/orders/@${encodeURIComponent(externalIdFor(orderId))}`) } catch (e) {
    if (e.status === 404) return null
    throw e
  }
}

/**
 * Called from the Stripe webhook for checkout.session.completed.
 * Never throws: failures are recorded on the order row (fulfillment_status /
 * printful_error) so the rest of the webhook still succeeds.
 */
export async function fulfillWithPrintful(supabase, session) {
  const orderId = session?.metadata?.orderId
  let claimedByMe = false
  const log = (...a) => console.log(`[printful] order ${orderId}:`, ...a)
  try {
    if (!orderId) return { skipped: 'no orderId' }
    if (session.payment_status !== 'paid') return { skipped: `payment_status=${session.payment_status}` }
    if (!process.env.PRINTFUL_API_TOKEN) { log('PRINTFUL_API_TOKEN not set — skipping'); return { skipped: 'not configured' } }

    const variantMap = parseVariantMap(process.env.PRINTFUL_VARIANT_MAP)
    const { data: order, error } = await supabase.from('orders')
      .select('id, items, printful_order_id, fulfillment_status, printful_claimed_at').eq('id', orderId).maybeSingle()
    if (error) throw new Error(`load order: ${error.message}`)

    const decision = decideFulfillment(order)
    if (decision.action !== 'create') { log('skip —', decision.reason); return { skipped: decision.reason } }

    const { podLines, manualLines, unmapped } = splitCart(order.items || [], variantMap)
    if (!podLines.length && !unmapped.length) return { skipped: 'no POD items' }
    if (unmapped.length) {
      await supabase.from('orders').update({
        fulfillment_status: 'printful_needs_mapping',
        printful_error: `No Printful variant for: ${unmapped.map(i => `${i.name || i.id} (${i.size})`).join(', ')}`,
      }).eq('id', orderId).is('printful_order_id', null)
      log('unmapped POD items — set PRINTFUL_VARIANT_MAP'); return { skipped: 'unmapped' }
    }
    const recipient = recipientFromSession(session)
    if (!recipient) {
      await supabase.from('orders').update({ fulfillment_status: 'printful_failed', printful_error: 'No shipping address on Stripe session' })
        .eq('id', orderId).is('printful_order_id', null)
      return { skipped: 'no address' }
    }

    // Atomic claim: only one delivery can move the row into "submitting".
    const nowIso = new Date().toISOString()
    let claim = supabase.from('orders')
      .update({ fulfillment_status: 'printful_submitting', printful_claimed_at: nowIso, printful_error: null })
      .eq('id', orderId).is('printful_order_id', null)
    claim = order.fulfillment_status == null
      ? claim.is('fulfillment_status', null)
      : claim.eq('fulfillment_status', order.fulfillment_status)
    if (order.printful_claimed_at) claim = claim.eq('printful_claimed_at', order.printful_claimed_at)
    else claim = claim.is('printful_claimed_at', null)
    const { data: claimed, error: claimError } = await claim.select('id')
    if (claimError) throw new Error(`claim: ${claimError.message}`)
    if (!claimed?.length) { log('lost claim race — skipping'); return { skipped: 'claimed elsewhere' } }

    claimedByMe = true
    const confirm = isConfirmEnabled(process.env.PRINTFUL_CONFIRM)
    // Second guard: Printful-side lookup by external_id (covers a crash after create).
    let pfOrder = await findPrintfulOrder(orderId)
    if (!pfOrder) {
      const payload = buildOrderPayload({ orderId, recipient, podLines })
      pfOrder = await pf(`/orders${confirm ? '?confirm=true' : ''}`, { method: 'POST', body: JSON.stringify(payload) })
    } else log('found existing Printful order', pfOrder.id)

    const { error: saveError } = await supabase.from('orders').update({
      printful_order_id: pfOrder.id,
      printful_status: pfOrder.status || null,
      fulfillment_status: fulfillmentStatusFromPrintful(pfOrder.status, confirm),
      printful_error: manualLines.length ? `Manual fulfillment needed for: ${manualLines.map(i => `${i.name || i.id} (${i.size || '-'}) x${i.qty}`).join(', ')}` : null,
    }).eq('id', orderId)
    if (saveError) console.error(`[printful] order ${orderId}: created Printful ${pfOrder.id} but save failed:`, saveError.message)
    log(`Printful order ${pfOrder.id} (${pfOrder.status}), ${podLines.length} POD line(s), ${manualLines.length} manual`)
    return { printfulOrderId: pfOrder.id }
  } catch (err) {
    console.error(`[printful] order ${orderId}: failed:`, err.message)
    if (orderId && claimedByMe) {
      await supabase.from('orders').update({ fulfillment_status: 'printful_failed', printful_error: String(err.message).slice(0, 500) })
        .eq('id', orderId).is('printful_order_id', null)
        .then(() => {}, () => {})
    }
    return { error: err.message }
  }
}
