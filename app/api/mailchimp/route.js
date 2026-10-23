export async function POST(request) {
  try {
    const { email, firstName, lastName, tags } = await request.json()

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const mailchimpKey = process.env.MAILCHIMP_API_KEY
    const LIST_ID = process.env.MAILCHIMP_LIST_ID
    const DC = mailchimpKey?.split('-').pop() // datacenter e.g. us21

    if (!mailchimpKey || !LIST_ID) {
      console.error('Mailchimp env vars missing')
      return Response.json({ error: 'Email signup is temporarily unavailable.' }, { status: 503 })
    }

    const data = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        ...(firstName && { FNAME: firstName }),
        ...(lastName && { LNAME: lastName }),
      },
      ...(tags?.length && { tags }),
    }

    const response = await fetch(
      `https://${DC}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`anystring:${mailchimpKey}`).toString('base64')}`,
        },
        body: JSON.stringify(data),
      }
    )

    const result = await response.json()

    // Member already exists — treat as success
    if (result.title === 'Member Exists') {
      return Response.json({ success: true, message: 'Already subscribed' })
    }

    if (!response.ok) {
      console.error('Mailchimp error:', result)
      return Response.json({ error: result.detail || 'Subscription failed' }, { status: 400 })
    }

    return Response.json({ success: true, message: 'Subscribed successfully' })
  } catch (error) {
    console.error('Mailchimp route error:', error.message)
    return Response.json({ error: 'Subscription failed' }, { status: 500 })
  }
}
