export async function POST(request) {
  try {
    const body = await request.json()
    const { email, type, data } = body

    if (!email || !type) {
      return Response.json({ error: 'Missing email or type' }, { status: 400 })
    }

    const subjects = {
      order_confirmed: 'Your Vibin order is confirmed ✓',
      order_shipped: 'Your Vibin order is on the way 📦',
      ambassador_approved: 'Welcome to the Vibin Ambassador Program',
      ambassador_rejected: 'Your Vibin Ambassador Application',
      support_received: 'We received your message — Vibin Support',
      support_resolved: 'Your support request has been resolved',
    }

    const subject = subjects[type] || `Vibin — ${type.replace(/_/g, ' ')}`

    const html = buildEmailHtml(type, data)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Vibin <noreply@vibinapparel.com>',
        to: [email],
        subject,
        html
      })
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Resend error:', err)
      return Response.json({ error: 'Email send failed', detail: err }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Notify error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

function buildEmailHtml(type, data = {}) {
  const base = (content) => `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px; }
      .card { background: #fff; max-width: 520px; margin: 0 auto; border-radius: 12px; overflow: hidden; }
      .header { background: #000; padding: 32px; text-align: center; }
      .header h1 { color: #fff; font-size: 28px; letter-spacing: 4px; margin: 0; }
      .body { padding: 32px; color: #333; font-size: 15px; line-height: 1.6; }
      .footer { padding: 20px 32px; font-size: 12px; color: #999; border-top: 1px solid #eee; text-align: center; }
      .btn { display: inline-block; background: #000; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    </style></head>
    <body><div class="card">
      <div class="header"><h1>VIBIN</h1></div>
      <div class="body">${content}</div>
      <div class="footer">Vibin Apparel · vibinapparel.com<br>A subsidiary of HVD Holdings, LLC</div>
    </div></body></html>
  `

  const templates = {
    order_confirmed: () => base(`
      <p>Hey${data.name ? ` ${data.name}` : ''},</p>
      <p>Your order <strong>#${data.orderId || ''}</strong> is confirmed. We’re getting it ready.</p>
      ${data.items ? `<p><strong>Items:</strong><br>${data.items}</p>` : ''}
      ${data.total ? `<p><strong>Total:</strong> $${data.total}</p>` : ''}
      <a href="https://vibinapparel.com/profile" class="btn">View Order →</a>
    `),
    order_shipped: () => base(`
      <p>Your order is on the way! 📦</p>
      ${data.tracking ? `<p><strong>Tracking:</strong> ${data.tracking}</p>` : ''}
      <a href="https://vibinapparel.com/profile" class="btn">Track Order →</a>
    `),
    ambassador_approved: () => base(`
      <p>Welcome to the team! Your ambassador application has been approved.</p>
      <p>You’ll earn <strong>15% commission</strong> on every sale you refer.</p>
      <a href="https://vibinapparel.com/ambassador" class="btn">Access Dashboard →</a>
    `),
    ambassador_rejected: () => base(`
      <p>Thank you for applying to the Vibin Ambassador Program.</p>
      <p>We’ve reviewed your application and aren’t moving forward at this time. We’ll keep your info on file for future opportunities.</p>
    `),
    support_received: () => base(`
      <p>We got your message and will get back to you within 24–48 hours.</p>
      ${data.message ? `<p><strong>Your message:</strong><br>${data.message}</p>` : ''}
    `),
    support_resolved: () => base(`
      <p>Your support request has been resolved.</p>
      ${data.resolution ? `<p>${data.resolution}</p>` : ''}
      <a href="https://vibinapparel.com/support" class="btn">Contact Us Again →</a>
    `),
  }

  return (templates[type] || (() => base(`<p>${JSON.stringify(data)}</p>`)))()
}
