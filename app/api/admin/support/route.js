import { createClient } from '@supabase/supabase-js'
import { requireAdmin, forbidden } from '../../../lib/admin-auth'
import { STATUSES, validateReply, statusAfterMessage } from '../../../lib/support.mjs'

export const dynamic = 'force-dynamic'

// Service role bypasses RLS — every handler checks requireAdmin() first.
function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}
const CHAT_COLS = 'id, chat_id, email, name, topic, order_number, status, source, subject, created_at, last_message_at, closed_at'

// GET ?status=open|answered|closed|all  -> threads (newest activity first)
// GET ?id=<uuid>                        -> one thread with messages
export async function GET(request) {
  if (!(await requireAdmin())) return forbidden()
  const p = new URL(request.url).searchParams
  const supabase = db()
  const id = p.get('id')
  if (id) {
    const { data: chat } = await supabase.from('support_chats').select(CHAT_COLS).eq('id', id).maybeSingle()
    if (!chat) return Response.json({ error: 'Not found' }, { status: 404 })
    const { data: messages } = await supabase.from('support_messages').select('id, sender, sender_email, message, created_at').eq('chat_id', id).order('created_at')
    return Response.json({ chat, messages: messages || [] })
  }
  const status = p.get('status') || 'open'
  let q = supabase.from('support_chats').select(CHAT_COLS).order('last_message_at', { ascending: false }).limit(200)
  if (status !== 'all') {
    if (!STATUSES.includes(status)) return Response.json({ error: 'Bad status' }, { status: 400 })
    q = q.eq('status', status)
  }
  const { data, error } = await q
  if (error) return Response.json({ error: error.message }, { status: 500 })
  const counts = {}
  for (const s of STATUSES) {
    const { count } = await supabase.from('support_chats').select('id', { count: 'exact', head: true }).eq('status', s)
    counts[s] = count || 0
  }
  return Response.json({ chats: data, counts })
}

// POST { id, message, close? } -> agent reply (status answered, or closed if close=true)
export async function POST(request) {
  const admin = await requireAdmin()
  if (!admin) return forbidden()
  const body = await request.json().catch(() => ({}))
  const v = validateReply(body)
  if (!body.id || !v.ok) return Response.json({ error: v.error || 'Missing thread id' }, { status: 400 })
  const supabase = db()
  const now = new Date().toISOString()
  const { error } = await supabase.from('support_messages').insert({ chat_id: body.id, sender: 'agent', sender_email: admin.email || null, message: v.value.message })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  const status = body.close ? 'closed' : statusAfterMessage('agent')
  await supabase.from('support_chats').update({ status, updated_at: now, last_message_at: now, closed_at: status === 'closed' ? now : null }).eq('id', body.id)
  return Response.json({ ok: true, status })
}

// PATCH { id, status } -> set open/answered/closed
export async function PATCH(request) {
  if (!(await requireAdmin())) return forbidden()
  const { id, status } = await request.json().catch(() => ({}))
  if (!id || !STATUSES.includes(status)) return Response.json({ error: 'Bad request' }, { status: 400 })
  const now = new Date().toISOString()
  const { error } = await db().from('support_chats').update({ status, updated_at: now, closed_at: status === 'closed' ? now : null }).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
