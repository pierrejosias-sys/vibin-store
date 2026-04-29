import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')

export async function POST(request) {
  try {
    const body = await request.json()
    const { items, email } = body

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
      success_url: `${request.headers.get('origin')}/checkout?success=true`,
      cancel_url: `${request.headers.get('origin')}/cart`,
      customer_email: email,
      metadata: {
        items: JSON.stringify(items.map(i => ({ id: i.id, name: i.name, qty: i.qty }))),
      },
    })

    return Response.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}