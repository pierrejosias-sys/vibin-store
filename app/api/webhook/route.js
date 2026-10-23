import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { pieceIdsFromMetadata, releasePieces } from '../../lib/pieces'
import { fulfillWithPrintful } from '../../lib/printful'

export const runtime = 'nodejs'

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
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = session.metadata?.orderId
      const ambassadorCode = session.metadata?.ambassadorCode
      const email = session.customer_email || session.customer_details?.email || null
      const paymentId = session.payment_intent
      const amountTotal = session.amount_total / 100 // convert cents to dollars
      const items = session.metadata?.items ? JSON.parse(session.metadata.items) : []

      // Calculate commission if this order has an ambassador code
      let commissionAmount = 0
      if (ambassadorCode) {
        const { data: ambassador } = await supabase
          .from('ambassadors')
          .select('commission_rate')
          .eq('code', ambassadorCode)
          .eq('status', 'approved')
          .single()

        const rate = ambassador?.commission_rate || 15
        commissionAmount = parseFloat(((amountTotal * rate) / 100).toFixed(2))
      }

      // Update order: mark paid, store payment ID, set commission
      if (orderId) {
        const updates = {
          status: 'paid',
          stripe_session_id: session.id,
          total_amount: amountTotal,
          ...(commissionAmount > 0 ? { commission_amount: commissionAmount, commission_status: 'pending' } : {}),
        }
        let { data: updated, error: updateError } = await supabase
          .from('orders').update(updates).eq('id', orderId).select('id')
        // total_amount comes from migration 20261022000003; until it's applied, don't let it block marking paid.
        if (updateError && /total_amount/.test(updateError.message || '')) {
          console.error(`Order ${orderId}: total_amount column missing, retrying without it — apply migration 20261022000003`)
          const { total_amount: _omit, ...rest } = updates
          ;({ data: updated, error: updateError } = await supabase
            .from('orders').update(rest).eq('id', orderId).select('id'))
        }
        if (updateError) {
          console.error(`❌ Order ${orderId}: failed to mark paid (session ${session.id}):`, updateError.message)
          throw new Error(`orders update: ${updateError.message}`) // 500 -> Stripe retries
        }
        if (!updated?.length) {
          console.error(`❌ Order ${orderId} not found when marking paid (session ${session.id})`)
        }
      } else {
        console.error(`❌ checkout.session.completed without orderId metadata (session ${session.id})`)
      }

      // Numbered drop pieces: held -> sold
      const pieceIds = pieceIdsFromMetadata(session.metadata)
      if (pieceIds.length) {
        const { data: soldCount, error: soldError } = await supabase.rpc('mark_pieces_sold', {
          p_piece_ids: pieceIds, p_order_id: orderId ? String(orderId) : null, p_session_id: session.id,
        })
        if (soldError) throw new Error(`mark_pieces_sold: ${soldError.message}`)
        if (soldCount !== pieceIds.length) {
          // A hold lapsed and the piece was re-claimed by another buyer — needs manual follow-up.
          console.error(`⚠️ Order ${orderId}: only ${soldCount}/${pieceIds.length} pieces marked sold (session ${session.id})`)
        }
      }

      // Print-on-demand: create the Printful order for POD lines (idempotent; never throws).
      if (orderId) await fulfillWithPrintful(supabase, session)

      // Log notification
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert({
          // notifications columns: user_email, type, title, message, is_read
          type: 'order_confirmation',
          user_email: email,
          title: `Order ${orderId || ''} confirmed`.trim(),
          message: JSON.stringify({ orderId: orderId || null, items }),
        })
      if (notifyError) console.error(`Order ${orderId}: notification log insert failed:`, notifyError.message)

      console.log(`✅ Order ${orderId} confirmed — payment: ${paymentId}, ambassador: ${ambassadorCode || 'none'}, commission: $${commissionAmount}`)
      return Response.json({ received: true })
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      const pieceIds = pieceIdsFromMetadata(session.metadata)
      if (pieceIds.length) {
        const released = await releasePieces(supabase, pieceIds, session.id)
        console.log(`Session ${session.id} expired — released ${released} piece(s)`)
      }
      if (session.metadata?.orderId) {
        const { error: expireError } = await supabase.from('orders').update({ status: 'expired' })
          .eq('id', session.metadata.orderId).eq('status', 'pending')
        if (expireError) console.error(`Order ${session.metadata.orderId}: failed to mark expired:`, expireError.message)
      }
      return Response.json({ received: true })
    }

    return Response.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err.message)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
