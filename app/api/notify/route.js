export async function POST(request) {
  try {
    const body = await request.json()
    const { email, type, data } = body

    // For now, just log and return success
    // In production, use Resend, SendGrid, or similar
    console.log('Notification:', { email, type, data })

    // Example: Send email (uncomment when you have an email service)
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     from: 'Vibin Support <support@vibinstore.com>',
    //     to: [email],
    //     subject: `Vibin Support - ${type.replace('_', ' ')}`,
    //     html: `<p>Your request has been ${type.includes('approved') ? 'approved' : 'received'}.</p><pre>${JSON.stringify(data, null, 2)}</pre>`
    //   })
    // })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
