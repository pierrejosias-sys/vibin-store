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
