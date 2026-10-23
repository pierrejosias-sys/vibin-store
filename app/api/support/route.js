import { createClient } from '@supabase/supabase-js'
import {
  isBot, validateTicket, validateReply, normalizeEmail, newAccessToken, hashToken, tokenMatches,
  newTicketCode, createRateLimiter, statusAfterMessage, publicThread, RATE_MAX, RATE_WINDOW_MS,
} from '../../lib/support.mjs'

export const dynamic = 'force-dynamic'

// Service role bypasses RLS: this route is the only public write path into support_chats/support_messages,
// and customers can only read a thread by presenting its email + access token.
function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}
const ipLimiter = createRateLimiter()
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const clientIp = req => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'

async function emailOverLimit(supabase, email) {
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count } = await supabase.from('support_messages').select('id', { count: 'exact', head: true })
    .eq('sender', 'customer').ilike('sender_email', email).gte('created_at', since)
  return (count || 0) >= RATE_MAX
}

async function loadThread(supabase, { ticket, email, token }) {
  const e = normalizeEmail(email)
  if (!e || typeof ticket !== 'string' || !/^[A-Z0-9-]{3,20}$/.test(ticket)) return null
  const { data: chat } = await supabase.from('support_chats').select('*').eq('chat_id', ticket).maybeSingle()
  if (!chat || chat.email?.toLowerCase() !== e || !tokenMatches(token, chat.access_token_hash)) return null
  return chat
}

// GET /api/support?ticket=VB-XXXXXX&email=...&token=... -> the customer's own thread
export async function GET(request) {
  const p = new URL(request.url).searchParams
  try {
    const supabase = db()
    const chat = await loadThread(supabase, { ticket: p.get('ticket'), email: p.get('email'), token: p.get('token') })
    if (!chat) return json({ error: 'Ticket not found.' }, 404)
    const { data: msgs } = await supabase.from('support_messages').select('sender, message, created_at').eq('chat_id', chat.id).order('created_at')
    return json({ thread: publicThread(chat, msgs || []) })
  } catch (err) {
    console.error('support GET', err.message)
    return json({ error: 'Something went wrong.' }, 500)
  }
}

// POST /api/support
//   new ticket: { email, name?, topic, orderNumber?, message, source?, website(honeypot) }
//   follow-up:  { ticket, email, token, message, website }
export async function POST(request) {
  let body
  try { body = await request.json() } catch { return json({ error: 'Invalid request.' }, 400) }
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request.' }, 400)
  // Honeypot: pretend success, store nothing.
  if (isBot(body)) return json({ ok: true, ticket: null })
  if (!ipLimiter(clientIp(request))) return json({ error: 'Too many messages. Please wait a few minutes or email hello@vibinapparel.com.' }, 429)

  try {
    const supabase = db()
    const now = new Date().toISOString()

    if (body.ticket) {
      const v = validateReply(body)
      if (!v.ok) return json({ error: v.error }, 400)
      const chat = await loadThread(supabase, body)
      if (!chat) return json({ error: 'Ticket not found.' }, 404)
      if (await emailOverLimit(supabase, chat.email)) return json({ error: 'Too many messages. Please wait a few minutes.' }, 429)
      const { error } = await supabase.from('support_messages').insert({ chat_id: chat.id, sender: 'customer', sender_email: chat.email, message: v.value.message })
      if (error) throw error
      await supabase.from('support_chats').update({ status: statusAfterMessage('customer'), closed_at: null, updated_at: now, last_message_at: now }).eq('id', chat.id)
      return json({ ok: true, ticket: chat.chat_id })
    }

    const v = validateTicket(body)
    if (!v.ok) return json({ error: v.error }, 400)
    const t = v.value
    if (await emailOverLimit(supabase, t.email)) return json({ error: 'Too many messages. Please wait a few minutes.' }, 429)
    const token = newAccessToken()
    const source = body.source === 'chat' ? 'chat' : 'contact'
    let chat = null
    for (let i = 0; i < 3 && !chat; i++) {
      const { data, error } = await supabase.from('support_chats').insert({
        chat_id: newTicketCode(), email: t.email, name: t.name, topic: t.topic, order_number: t.orderNumber,
        subject: `${t.topic}${t.orderNumber ? ` · #${t.orderNumber}` : ''}`, status: 'open', source,
        access_token_hash: hashToken(token), updated_at: now, last_message_at: now,
      }).select('id, chat_id').single()
      if (data) chat = data
      else if (error?.code !== '23505') throw error
    }
    if (!chat) throw new Error('could not allocate ticket code')
    const { error: mErr } = await supabase.from('support_messages').insert({ chat_id: chat.id, sender: 'customer', sender_email: t.email, message: t.message })
    if (mErr) { await supabase.from('support_chats').delete().eq('id', chat.id); throw mErr }
    return json({ ok: true, ticket: chat.chat_id, token, email: t.email }, 201)
  } catch (err) {
    console.error('support POST', err.message)
    return json({ error: 'We could not send that. Please email hello@vibinapparel.com.' }, 500)
  }
}
