export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const API_KEY = process.env.MAILCHIMP_API_KEY
    const LIST_ID = process.env.MAILCHIMP_LIST_ID
    const DC = API_KEY?.split('-').pop()

    if (!API_KEY || !LIST_ID) {
      return Response.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // MD5 hash of lowercase email required by Mailchimp API
    const crypto = await import('crypto')
    const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex')

    const response = await fetch(
      `https://${DC}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${emailHash}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`anystring:${API_KEY}`).toString('base64')}`,
        },
        body: JSON.stringify({ status: 'unsubscribed' }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      // Member not found is fine — already unsubscribed
      if (result.title === 'Resource Not Found') {
        return Response.json({ success: true, message: 'Unsubscribed' })
      }
      return Response.json({ error: result.detail || 'Unsubscribe failed' }, { status: 400 })
    }

    return Response.json({ success: true, message: 'Unsubscribed successfully' })
  } catch (error) {
    console.error('Unsubscribe error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
