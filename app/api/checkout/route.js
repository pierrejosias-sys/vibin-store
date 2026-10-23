import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_SESSION_MINUTES } from '../../lib/drops'
import {
  resolveDropItems, claimDropPieces, releasePieces,
  pieceIdsToMetadata,
} from '../../lib/pieces'
import { resolveCatalogItems, sanitizeItem } from '../../lib/pricing'
import { getSessionUser } from '../../lib/admin-auth'
import { shippingFor, FREE_SHIPPING_LABEL } from '../../lib/shipping'
import { DROPS } from '../../lib/drops'
import { DROP_CATALOG, enforceDropCatalog, shipsInTwoPackages, TWO_PACKAGES_NOTE } from '../../lib/drop-catalog.mjs'
import { serverNow } from '../../lib/drop-window.mjs'

// Clients are created per request so the build doesn't need secrets
// (preview environments may not have Stripe/Supabase keys configured).
// Service role key — runs server-side and needs to bypass RLS.
function getClients() {
  return {
    stripe: new Stripe(process.env.STRIPE_SECRET_KEY),
    supabase: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY),
  }
}

export async function POST(request) {
  const { stripe, supabase } = getClients()
  let pieceIds = []
  try {
    const body = await request.json()
    const { email, ambassadorCode } = body
    // Never trust a client-sent userId — derive it from the verified session cookie.
    const sessionUser = await getSessionUser()
    const userId = sessionUser?.id || null

    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
      return Response.json({ error: 'Your cart is empty.' }, { status: 400 })
    }
    // Client prices/names are discarded; resolve*Items() fill them from the DB.
    const items = body.items.map(sanitizeItem)

    const { error: catalogError, status: catalogStatus } = await resolveCatalogItems(supabase, items)
    if (catalogError) return Response.json({ error: catalogError }, { status: catalogStatus || 400 })

    // Drop-window catalog items (Foundation Tee, Snapback): same window + pre-order rules.
    const dropIdsForCatalog = Object.keys(DROP_CATALOG)
    const { data: windowDrops, error: windowErr } = await supabase.from('drops')
      .select('id, name, release_at, closes_at').in('id', dropIdsForCatalog)
    if (windowErr) throw new Error(windowErr.message)
    const shipsBy = Object.fromEntries(dropIdsForCatalog.map(id => [id, DROPS[id]?.shipsBy || null]))
    const { error: windowError, status: windowStatus, preorderItems } = enforceDropCatalog(items, windowDrops || [], { now: serverNow(), shipsBy })
    if (windowError) return Response.json({ error: windowError }, { status: windowStatus || 400 })

    // Numbered drop items: validate, price server-side, and hold pieces before payment.
    const { dropItems, error: dropError, status: dropStatus } = await resolveDropItems(supabase, items)
    if ((dropItems?.length || preorderItems.length) && body.preorderAck !== true) {
      return Response.json({ error: 'Please confirm you understand this is a pre-order.' }, { status: 400 })
    }
    if (dropError) return Response.json({ error: dropError }, { status: dropStatus || 400 })
    if (dropItems.length) {
      const claim = await claimDropPieces(supabase, dropItems)
      if (claim.soldOut) {
        return Response.json(
          { error: `Sold out: ${claim.soldOut.name} (${claim.soldOut.size}). Update your cart and try again.`, soldOut: claim.soldOut },
          { status: 409 }
        )
      }
      pieceIds = claim.pieceIds
    }

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)

    // Create order record in Supabase first so we have an orderId
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email: email,
        user_id: userId || null,
        items,
        total,
        status: 'pending',
        ambassador_code: ambassadorCode || null,
      })
      .select('id')
      .single()

    if (orderError) throw new Error(orderError.message)

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.preorder
            ? `Pre-order · Ships by ${item.shipsBy} · Size ${item.size}`
            : `${item.color} / ${item.size}`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }))

    // Shipping computed server-side from config ($8 flat, free at FREE_SHIPPING_THRESHOLD+).
    const shippingAmount = shippingFor(total)

    // Hoodie (Printful) + tee/snapback (in-house) ship separately: say so on Stripe's page and receipt.
    const twoPackages = shipsInTwoPackages(items)

    const session = await stripe.checkout.sessions.create({
      ...(twoPackages ? {
        custom_text: { submit: { message: TWO_PACKAGES_NOTE } },
        payment_intent_data: { description: `Vibin Apparel order #${order.id}. ${TWO_PACKAGES_NOTE}` },
      } : {}),
      payment_method_types: ['card'],
      // Needed for Printful fulfillment (US only).
      shipping_address_collection: { allowed_countries: ['US'] },
      line_items: lineItems,
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: shippingAmount === 0 ? `Free shipping (orders ${FREE_SHIPPING_LABEL}+)` : 'Standard shipping',
          fixed_amount: { amount: Math.round(shippingAmount * 100), currency: 'usd' },
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 5 },
            maximum: { unit: 'business_day', value: 8 },
          },
        },
      }],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/checkout?success=true&order=${order.id}`,
      cancel_url: `${request.headers.get('origin')}/cart`,
      customer_email: email,
      // Stripe minimum is 30 minutes; piece holds last slightly longer (PIECE_HOLD_MINUTES).
      ...(pieceIds.length ? { expires_at: Math.floor(Date.now() / 1000) + STRIPE_SESSION_MINUTES * 60 } : {}),
      metadata: {
        orderId: String(order.id),
        ambassadorCode: ambassadorCode || '',
        shipping: String(shippingAmount),
        ...(twoPackages ? { packages: '2' } : {}),
        items: JSON.stringify(items.map(i => ({ id: i.id, name: i.name, qty: i.qty }))),
        ...pieceIdsToMetadata(pieceIds),
      },
    })

    if (pieceIds.length) {
      const { error: attachError } = await supabase.rpc('attach_piece_session', {
        p_piece_ids: pieceIds, p_session_id: session.id, p_order_id: String(order.id),
      })
      if (attachError) console.error('attach_piece_session failed:', attachError.message)
    }

    return Response.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    // Don't strand held pieces if anything after the claim failed.
    if (pieceIds.length) await releasePieces(supabase, pieceIds)
    console.error('Checkout error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
