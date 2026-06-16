import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { items, email, ambassadorCode, userId } = body

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
      metadata: {
        orderId: String(order.id),
        ambassadorCode: ambassadorCode || '',
        items: JSON.stringify(items.map(i => ({ id: i.id, name: i.name, qty: i.qty }))),
      },
    })

    return Response.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Checkout error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
