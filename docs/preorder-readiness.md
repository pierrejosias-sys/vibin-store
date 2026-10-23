# Drop 01 pre-order readiness (Stripe TEST mode) — Oct 23, 2026

Scope: tee, hoodie and snapback product pages → cart → checkout → order row → confirmation, then the webhook, the
waitlist early-access lock, and Printful routing. Code at `main` @ 12ee506. Nothing was deployed, merged or written to prod data.

**How it was tested**
* **Unit tests:** `npm test` passes, 58/58. Suites cover drop-window, drop-catalog, early-access, waitlist-lock,
  drop01-images-packages, printful and printful-fulfill.
* **Live probes** of `https://vibinapparel.com/api/checkout` (Stripe test keys). The window check runs *before* any
  DB write, so a 409 creates no rows.
* **Headless Chrome at 390 px** for the drop, tee and snapback pages.
* **Read-only Supabase queries** of `orders` and `pieces`.

**Not run (needs your approval):** a local `npm run dev` with secrets from `vercel env pull`, and `stripe listen`.
The env pull was blocked pending approval, and the box has no Stripe CLI. So I haven't run a pre-order *payment*
(window overridden locally) end to end. The non-drop payment path is proven in prod test mode: see order #5 below.

## 1. What works
| Area | Evidence |
|---|---|
| Pages load | `/`, `/shop`, `/drop/01`, `/cart`, `/checkout`, `/product/vibin-classic-tee`, `/snapback` → 200. All read well at 390 px. |
| Window lock | Tee, snapback and hoodie (`d01/hd`, size 3X) all return **409** "pre-order has not opened yet" today, with or without `preorderAck`. No order rows are created. |
| Hoodie sizes | S, M, L, XL, 2X, 3X on `/drop/01`. The server validates against `sizesForStyle('hd')` (`app/lib/drops.js`, `app/lib/pieces.js`). |
| Tee sizes | S–3X (`app/lib/drop-catalog.mjs`, `app/product/[slug]/page.js`). The snapback is one size. |
| Shipping | `app/lib/shipping.js`: $8 flat, free at a $125+ subtotal. Cart, checkout and Stripe use the same function. Order #5 charged $54.99 + $8 = **$62.99** (`total_amount`). |
| Pre-order checkbox | `app/checkout/CheckoutClient.js:211-218`. Shown and required when any line has `drop` or `preorder`. The tee, snapback and drop pages set those flags. The server also rejects a missing `preorderAck` with a 400 (`app/api/checkout/route.js`). |
| Two-package notice | A mixed hoodie + tee/snapback cart shows the "ships in two packages" note in checkout and on the Stripe page (`custom_text`). |
| Stripe test checkout + webhook | Order **#5** (cargo shorts, created 9:19 AM ET today by another tester) is `paid`, with a `cs_test_…` session and `total_amount` 62.99. So `/api/checkout` → Stripe (test) → `/api/webhook` (`checkout.session.completed`) → `orders` update works in prod. |
| Piece holds | All 50 `hd` pieces are `available`; `cj`/`wb`/`ns` are `withheld`. Holds are claimed at checkout, released on `checkout.session.expired` or on error (`app/lib/pieces.js`). |
| Early-access lock | The code path is in `app/api/checkout/route.js`, `app/lib/waitlist.mjs` and `app/lib/early-access.mjs`. Unit tests cover: invalid/used/in-use link → 403, atomic lock, release on expiry/error. |
| Printful | Only `hd` lines are routed (`PRINTFUL_PRODUCTS = ['hd']`). Without `PRINTFUL_API_TOKEN` it is a no-op ("not configured"), covered by tests. No insert/QR data is sent. |
| Confirmation | `/checkout?success=true&order=<id>` shows "Order #id" (`CheckoutClient.js:229-233`). |

## 2. What's broken / risky
| Severity | Issue | Where |
|---|---|---|
| **High** | **Early-access links can't be delivered.** `BREVO_API_KEY` / `BREVO_WAITLIST_LIST_ID` are not set in Vercel, so `sendLinkEmail` and `syncSignupToBrevo` skip. Waitlist sign-ups are stored, but nobody receives a private link. The 6 PM ET early hour effectively won't work. | `app/lib/brevo.mjs:8-61`, `app/api/waitlist/route.js` |
| **High** | **No order-confirmation email from us.** The webhook only inserts a `notifications` row. With `RESEND_API_KEY` unset, and Supabase SMTP failing (`535 Invalid username`), customers get only Stripe's receipt. Stripe sends that only if it's enabled, and never in test mode. | `app/api/webhook/route.js:103-111`, `app/api/notify/route.js` |
| **High** | **Live payments not configured.** Vercel has Stripe *test* keys. Going live needs live keys, a live webhook endpoint with `checkout.session.completed` + `checkout.session.expired`, and its `STRIPE_WEBHOOK_SECRET`. | Vercel env |
| Medium | **The pre-order payment path is untested end to end.** The window override + `stripe listen` run is still pending, and so is the piece hold → sold path (`mark_pieces_sold`). Run it before Nov 12 using a local override, never prod data. | `app/api/webhook/route.js`, `app/lib/pieces.js` |
| Medium | **The success page trusts the URL.** `?success=true&order=N` shows "payment was successful" without checking the order status. Anyone can load it; it's cosmetic, but it can mislead. | `app/checkout/CheckoutClient.js:41-45,229-233` |
| Medium | **"Now live" copy before the window.** The snapback promo bar says "Drop 01 — Snapback Now Live". Site metadata says "Drop 01: The Foundation — now live", and the checkout promo says "SS26 Drop is live". Add-to-bag is enabled, and checkout then fails with a 409. | `app/snapback/page.js:338`, `app/layout.js:30,38`, `app/checkout/CheckoutClient.js:104,125-126` |
| Low | **`order.total` is the subtotal.** The charged amount is in `total_amount`, written only by the webhook. Admin views must use `total_amount`. | `app/api/checkout/route.js` |
| Low | **`success_url` and `cancel_url` are built from the request `Origin` header.** A request with no Origin gets `null/checkout…`. | `app/api/checkout/route.js` |
| Low | **Test rows left in prod.** Order #1 (`jcarter@test.com`, pending, June) and order #5 (another tester's paid test order) are not mine, so I left them. Orders #2–4 are cancelled test rows. | `orders` table |
| Info | **Two migrations share a timestamp:** `20261023000003_*`. Both are applied. | `supabase/migrations/` |

## 3. Keys and accounts only Josias can provide
| Item | Where | Then |
|---|---|---|
| Stripe **live** secret + publishable keys | https://dashboard.stripe.com/apikeys | Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Production) at https://vercel.com/team_4QgnaZOcozdgjGoDhf0EwX7T/vibin-store/settings/environment-variables |
| Live webhook endpoint + signing secret | https://dashboard.stripe.com/webhooks. Add `https://vibinapparel.com/api/webhook` with **`checkout.session.completed`** and **`checkout.session.expired`**. | Set `STRIPE_WEBHOOK_SECRET` (Production) |
| Stripe customer receipts | https://dashboard.stripe.com/settings/emails. Turn on "Successful payments". | — |
| Printful token + store id | https://developers.printful.com/tokens. Scopes: orders, products, file library, webhooks. Get the store id from `GET /stores`. | Set `PRINTFUL_API_TOKEN` and `PRINTFUL_STORE_ID` (Production), then redeploy. See `docs/printful-setup.md`. |
| Brevo API key + waitlist list id | https://app.brevo.com/settings/keys/api, and https://app.brevo.com/contact/list for the list id | Set `BREVO_API_KEY` and `BREVO_WAITLIST_LIST_ID` (Production) |
| Brevo **SMTP** for Supabase Auth | https://app.brevo.com/settings/keys/smtp (SMTP key + login) → https://supabase.com/dashboard/project/grbwnjnngzcsjlubcmtp/auth/smtp | Host `smtp-relay.brevo.com`, port 587, sender hello@vibinapparel.com / Vibin Apparel. See `docs/auth-setup.md`. |
| Order-confirmation email sender (Resend), if used | https://resend.com/api-keys, with the domain verified at https://resend.com/domains | Set `RESEND_API_KEY` (Production) |
| Supabase Auth URLs | https://supabase.com/dashboard/project/grbwnjnngzcsjlubcmtp/auth/url-configuration | Site URL `https://vibinapparel.com`, plus the redirect URLs |
| Approval to pull env locally | — | Lets an agent run `vercel env pull` + `stripe listen` for the full pre-order payment test (Medium item above) |
