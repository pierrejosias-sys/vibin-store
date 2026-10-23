import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_SESSION_MINUTES } from '../../lib/drops'
import {
  resolveDropItems, claimDropPieces, releasePieces,
  pieceIdsToMetadata,
} from '../../lib/pieces'
import { resolveCatalogItems, sanitizeItem } from '../../lib/pricing'
import { getSessionUser } from '../../lib/admin-auth'

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

    // Numbered drop items: validate, price server-side, and hold pieces before payment.
    const { dropItems, error: dropError } = await resolveDropItems(supabase, items)
    if (dropError) return Response.json({ error: dropError }, { status: 400 })
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
          description: `${item.color} / ${item.size}`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/checkout?success=true&order=${order.id}`,
      cancel_url: `${request.headers.get('origin')}/cart`,
      customer_email: email,
      // Stripe minimum is 30 minutes; piece holds last slightly longer (PIECE_HOLD_MINUTES).
      ...(pieceIds.length ? { expires_at: Math.floor(Date.now() / 1000) + STRIPE_SESSION_MINUTES * 60 } : {}),
      metadata: {
        orderId: String(order.id),
        ambassadorCode: ambassadorCode || '',
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
