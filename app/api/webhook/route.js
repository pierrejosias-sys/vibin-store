import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Use service role key — webhook runs server-side, needs to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
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
      const email = session.customer_email
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
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_session_id: session.id,
            total_amount: amountTotal,
            commission_amount: commissionAmount > 0 ? commissionAmount : undefined,
            commission_status: commissionAmount > 0 ? 'pending' : undefined,
          })
          .eq('id', orderId)
      }

      // Log notification
      await supabase
        .from('notifications')
        .insert({
          type: 'order_confirmation',
          email,
          order_id: orderId || null,
          items: JSON.stringify(items),
          status: 'sent',
          created_at: new Date().toISOString(),
        })

      console.log(`✅ Order ${orderId} confirmed — payment: ${paymentId}, ambassador: ${ambassadorCode || 'none'}, commission: $${commissionAmount}`)
      return Response.json({ received: true })
    }

    return Response.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err.message)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
