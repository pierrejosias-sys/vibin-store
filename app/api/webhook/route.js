import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
      const email = session.customer_email
      const paymentId = session.payment_intent
      const items = session.metadata?.items ? JSON.parse(session.metadata.items) : []

      if (orderId) {
        await supabase
          .from('orders')
          .update({ status: 'paid', stripe_payment_id: paymentId })
          .eq('id', orderId)
      }

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

      console.log(`✅ Order confirmed — payment: ${paymentId}, email: ${email}`)
      return Response.json({ received: true })
    }

    return Response.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err.message)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
