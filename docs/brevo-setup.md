# Brevo setup: Drop 01 waitlist

Waitlist sign-ups are saved in Supabase (`waitlist_signups`). That table is server-only through RLS.
After saving, the server syncs each sign-up to a Brevo list.

Brevo is optional. If its env vars are unset, sign-ups still save, the sync is skipped quietly, and `synced_at` stays null until the backfill script runs.

Brevo is used only for the waitlist. Order receipts stay in Stripe.
The site sends exactly one kind of transactional email: the "here's your link" resend described in section 4b.

## 1. Create the attributes and the list
1. Go to **Contacts → Settings → Contact attributes**. Create two **Text** attributes named exactly
   `EARLY_ACCESS_LINK` and `SOURCE`. If they don't exist, Brevo rejects the sync.
2. Go to **Contacts → Lists → Create a list**, e.g. "Drop 01 Waitlist". Note the list's numeric **ID**.

## 2. Create an API key
Go to **https://app.brevo.com/settings/keys/api**, click **Generate a new API key**, and copy the `xkeysib-…` value.
Under **Security → Authorised IPs**, either leave IP restriction off or allow Vercel's egress IPs. Vercel functions don't use fixed IPs.

## 3. Add env vars in Vercel
Add these to project `vibin-store`, for Production and Preview:

| Name | Value |
|---|---|
| `BREVO_API_KEY` | the API key (mark it **Sensitive**) |
| `BREVO_WAITLIST_LIST_ID` | the numeric list ID |
| `BREVO_SENDER_EMAIL` | `hello@vibinapparel.com` (the sender must be verified in Brevo under **Senders, Domains & Dedicated IPs**, ideally with the domain authenticated) |

Redeploy after adding them.

## 4. What happens on sign-up
`POST /api/waitlist` receives sign-ups from the /drop/01 waitlist, the coming-soon forms, and the homepage newsletter.

1. It upserts the email into `waitlist_signups`, deduped by email (case-insensitive).
   - It merges `sources` and `styles`.
   - It issues one private `early_access_token` per email.
2. It calls `POST https://api.brevo.com/v3/contacts` with header `api-key: $BREVO_API_KEY` and this body:
   ```json
   { "email": "...", "attributes": { "EARLY_ACCESS_LINK": "https://vibinapparel.com/drop/01?access=<token>", "SOURCE": "d01-waitlist" },
     "listIds": [BREVO_WAITLIST_LIST_ID], "updateEnabled": true }
   ```
3. On success it sets `synced_to='brevo'` and `synced_at`.
   On failure it stores `sync_error`, and the sign-up itself still succeeds.

## 4b. Re-signup: link by email (never on the page)
- **New sign-up:** the thank-you state shows the private link with a copy button. That's safe because the person just created it.
- **Email already on the list:** the page only says "You're already on the list. Your link is in your email." It never shows the link, because anyone can type someone else's email.
- **The resend:** the server sends **one** email to that address via `POST https://api.brevo.com/v3/smtp/email` (header `api-key`, sender `BREVO_SENDER_EMAIL`).
  - Rate limit: at most once per email per 24h, tracked in `last_link_email_at` and claimed atomically.
  - Never bulk: one recipient per request.
  - Skipped quietly when `BREVO_API_KEY` is unset.

## 4c. One checkout per link
- **Lock:** during 6–7 PM ET, `/api/checkout` atomically locks the link (`locked_at`, `locked_session_id`). The lock only succeeds if the link is unused and either unlocked or locked more than ~35 min ago (the Stripe session lives 30 min).
- **One attempt at a time:** a second simultaneous checkout with the same link is rejected.
- **`checkout.session.expired`:** releases the lock.
- **`checkout.session.completed`:** marks the link used (`token_used_at`) and clears the lock.
- **Webhook events:** add `checkout.session.expired` to the Stripe webhook.

## 5. Backfill / retry
```
NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… BREVO_API_KEY=… BREVO_WAITLIST_LIST_ID=… \
  node scripts/brevo-backfill.mjs [--limit 500] [--dry-run]
```
This syncs consented rows where `synced_at IS NULL`.

## 6. Sending the early-access email (send by Nov 6)
Create a Brevo campaign to the waitlist list. Insert the link with `{{ contact.EARLY_ACCESS_LINK }}`.

How the early-access hour works:
- It runs **Thu Nov 12, 2026, 6:00–7:00 PM ET**.
- The link sets a cookie, and `/api/checkout` accepts only valid, **unused** tokens during that hour.
- Each token covers **one** completed checkout. The Stripe webhook marks it used on `checkout.session.completed`.
- From 7:00 PM ET, everyone can pre-order.

## CSV export
For other tools, or as a manual fallback, run:
`node scripts/export-waitlist.mjs --consented-only --out waitlist-export.csv`

The CSV contains the private links. Treat it as sensitive; it's gitignored.
