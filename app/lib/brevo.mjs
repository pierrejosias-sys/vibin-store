/**
 * Brevo contact sync (email list only — Brevo sends nothing here; receipts stay in Stripe).
 * Env: BREVO_API_KEY, BREVO_WAITLIST_LIST_ID. If either is unset, every call is a quiet no-op.
 * Docs: docs/brevo-setup.md
 */
const URL_CONTACTS = 'https://api.brevo.com/v3/contacts'

export function brevoConfig(env = process.env) {
  const key = env.BREVO_API_KEY, listId = Number(env.BREVO_WAITLIST_LIST_ID)
  return key && Number.isInteger(listId) && listId > 0 ? { key, listId } : null
}

export function contactPayload({ email, earlyAccessLink, source }, listId) {
  return {
    email,
    attributes: { EARLY_ACCESS_LINK: earlyAccessLink, SOURCE: source },
    listIds: [listId],
    updateEnabled: true,
  }
}

/** Returns { skipped: true } | { ok: true } | { ok: false, error }. Never throws. */
export async function syncSignupToBrevo(signup, { env = process.env, fetchImpl = fetch } = {}) {
  const cfg = brevoConfig(env)
  if (!cfg) return { skipped: true }
  try {
    const res = await fetchImpl(URL_CONTACTS, {
      method: 'POST',
      headers: { 'api-key': cfg.key, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(contactPayload(signup, cfg.listId)),
    })
    // 201 created, 204 updated (updateEnabled)
    if (res.ok) return { ok: true }
    let detail = ''
    try { detail = (await res.json())?.code || '' } catch {}
    return { ok: false, error: `brevo ${res.status}${detail ? ` ${detail}` : ''}` }
  } catch (err) {
    return { ok: false, error: String(err?.message || err).slice(0, 200) }
  }
}

export const DEFAULT_SENDER = 'hello@vibinapparel.com'

/** One-to-one transactional email: "here's your private early-access link". Never bulk. */
export function linkEmailPayload({ email, link }, senderEmail = DEFAULT_SENDER) {
  return {
    sender: { name: 'Vibin Apparel', email: senderEmail },
    to: [{ email }],
    subject: 'Your Drop 01 early-access link',
    htmlContent: `<p>You're on the Vibin Apparel Drop 01 waitlist.</p>
<p>Your private early-access link: <a href="${link}">${link}</a></p>
<p>It works <strong>Thu Nov 12, 6:00–7:00 PM ET</strong> for <strong>one checkout</strong>. From 7:00 PM ET, the pre-order is open to everyone.</p>
<p>Keep this link private. It's tied to your email.</p>`,
    textContent: `Your private Drop 01 early-access link: ${link}\nIt works Thu Nov 12, 6:00–7:00 PM ET for one checkout. From 7:00 PM ET the pre-order is open to everyone. Keep it private.`,
    tags: ['waitlist-link-resend'],
  }
}

/** Returns { skipped: true } | { ok: true } | { ok: false, error }. Never throws. */
export async function sendLinkEmail({ email, link }, { env = process.env, fetchImpl = fetch } = {}) {
  if (!env.BREVO_API_KEY) return { skipped: true }
  try {
    const res = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(linkEmailPayload({ email, link }, env.BREVO_SENDER_EMAIL || DEFAULT_SENDER)),
    })
    return res.ok ? { ok: true } : { ok: false, error: `brevo smtp ${res.status}` }
  } catch (err) {
    return { ok: false, error: String(err?.message || err).slice(0, 200) }
  }
}
