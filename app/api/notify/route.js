export async function POST(request) {
  try {
    const body = await request.json()
    const { email, type, orderId, data } = body

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      'https://grbwnjnngzcsjlubcmtp.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYnduam5uZ3pjc2psdWJjbXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTgzMDEsImV4cCI6MjA5MjkzNDMwMX0.SYKFZJ0XVua0JmZ-tkaNhec2M3KtG3tS5vj_1Nl261c'
    )

    // Store notification in database
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        type,
        email,
        order_id: orderId,
        data: JSON.stringify(data),
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Notification error:', error)
    }

    return Response.json({ success: true, notification })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}