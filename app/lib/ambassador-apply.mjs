/**
 * Ambassador applications, server side (service role). The browser never reads the ambassadors table
 * directly any more: RLS only lets a signed-in user see their own row (and admins see all).
 */
import { randomBytes } from 'node:crypto'

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
const likeExact = s => s.replace(/[\\%_]/g, m => '\\' + m)

export function normalizeApplyEmail(v) {
  const e = clip(v, 320).toLowerCase()
  return EMAIL_RE.test(e) ? e : null
}

/** True if any application exists for this email (case-insensitive). Returns only a boolean. */
export async function ambassadorEmailExists(supabase, email) {
  const { data, error } = await supabase.from('ambassadors').select('id').ilike('email', likeExact(email)).limit(1)
  if (error) throw new Error(error.message)
  return (data || []).length > 0
}

/** Validated, server-controlled row: status/commission/code can't be chosen by the client. */
export function applicationRow(body, now = new Date()) {
  const email = normalizeApplyEmail(body?.email)
  const name = clip(body?.name, 120)
  const why = clip(body?.why, 2000)
  if (!email) return { error: 'Enter a valid email.' }
  if (!name) return { error: 'Enter your name.' }
  if (!why) return { error: 'Tell us why you want to join.' }
  return {
    row: {
      name, email, why,
      instagram_handle: clip(body?.instagram, 60) || null,
      tiktok_handle: clip(body?.tiktok, 60) || null,
      audience_size: clip(body?.audience, 40) || null,
      // code is NOT NULL + UNIQUE; the admin approval flow replaces this placeholder.
      code: `PENDING-${randomBytes(6).toString('hex').toUpperCase()}`,
      status: 'pending',
      commission_rate: 15,
      created_at: now.toISOString(),
    },
  }
}

/** Gate on /ambassador/login: status for a referral code, nothing else. */
export async function ambassadorCodeStatus(supabase, code) {
  const c = clip(code, 40).toUpperCase()
  if (!/^[A-Z0-9-]{2,40}$/.test(c) || c.startsWith('PENDING-')) return 'invalid'
  const { data, error } = await supabase.from('ambassadors').select('status').eq('code', c).limit(1)
  if (error) throw new Error(error.message)
  const s = data?.[0]?.status
  return !s ? 'invalid' : s === 'approved' ? 'approved' : s === 'pending' ? 'pending' : 'inactive'
}
