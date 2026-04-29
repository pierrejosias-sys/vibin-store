import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://grbwnjnngzcsjlubcmtp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYnduam5uZ3pjc2psdWJjbXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTgzMDEsImV4cCI6MjA5MjkzNDMwMX0.SYKFZJ0XVua0JmZ-tkaNhec2M3KtG3tS5vj_1Nl261c'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request) {
  try {
    const body = await request.json()
    const { orderId, email, items, status } = body

    if (status === 'paid' || status === 'completed') {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'paid', stripe_payment_id: body.paymentId })
        .eq('id', orderId)
        .select()

      const { error: emailError } = await supabase
        .from('notifications')
        .insert({
          type: 'order_confirmation',
          email,
          order_id: orderId,
          items: JSON.stringify(items),
          status: 'sent',
          created_at: new Date().toISOString()
        })

      return Response.json({ success: true, order: data })
    }

    return Response.json({ success: false, message: 'Invalid status' })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}