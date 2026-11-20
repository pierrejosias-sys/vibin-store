# Refund webhook + existing admin orders — local plan (Fri Nov 20, 2026, ET)

**LOCAL ONLY.** Nothing was pushed, no PR was opened, and nothing was deployed. No env changes. No live DB writes. No Stripe writes. No secrets are printed here; env var names only.

**Stack:** the live repo is **Next.js 16 (App Router)**. This work is small edits on that app (`app/admin/orders`, `app/api/admin/orders`, `app/api/webhook`, middleware, and a server layout). No new framework and no new npm dependencies.

Repo worktree: `/workspace/refund-webhook-nov20`, branch `refund-webhook-nov20`, base `cabbb89` (production / origin/main as of this morning). Josias: "We have a admin page." No new CS admin page was added. Refunds land on the existing `/admin/orders` page, alongside the existing `/admin/support` queue.

## Commits on `refund-webhook-nov20` (held, not pushed)

| # | Commit | What |
|---|---|---|
| 1 | `6b7e5e8` | server layout, `ADMIN_EMAILS` allowlist, noindex/no-store, `/support-agent` gate |
| 2 | `d890808` | rate-limited `POST /api/admin/login`; signed-out `/admin/login` |
| 3 | `f76dc48` | CS field list on `/api/admin/orders`; dashboard uses the API |
| 4 | `7d1100d` | `charge.refunded` handler, refunds on `/admin/orders`, held migration |
| 5 | tip of this branch | tests and this plan |

See `git log cabbb89..HEAD` for full hashes. Commit 5 is the branch tip.

## How to ship this (options)

**Option A (recommended): existing `/admin/orders` page plus a support-queue ticket.**  
When a `charge.refunded` event is recorded, CS sees it on `/admin/orders` *and* an open ticket appears in `/admin/support` (topic `returns`, system message with the CS fields). That is what this branch implements (`REFUND_SUPPORT_TICKET = true` in `app/lib/order-cs.mjs`).

**Option B: existing page only.**  
Same refund columns on `/admin/orders`, no ticket. Flip `REFUND_SUPPORT_TICKET` to `false` (one line) if Josias prefers this.

**Email alert:** drafted in `draftRefundAlertEmail()` but **off** (`REFUND_EMAIL_ALERT = false`). It does not send unless approved and the flag is flipped.

The held DB migration `supabase/migrations/20261120120000_order_refunds_cs.sql` is **not applied**. It needs its own yes before anyone runs it against `grbwnjnngzcsjlubcmtp`. The webhook will 500 (and Stripe will retry) if the handler is deployed before the table exists.

## 1. Existing admin surface (read-only, cabbb89 + live GETs)

Checked Fri Nov 20, 2026, ~10:42–10:45 AM ET. Unauthenticated GET only; no credentials were tried.

| Path | URL on vibinapparel.com | Lockdown on cabbb89 (before this branch) | Live unauthenticated GET |
|---|---|---|---|
| `app/admin/page.js` | https://vibinapparel.com/admin | Middleware: Supabase `getUser()` + `profiles.is_admin`. Page is `'use client'` and also checks `getSession()` in a `useEffect`. Data was loaded with the browser anon client (`orders.select('*')`). No server layout, no `requireAdmin()` in the page, no robots metadata. | **307** → `/login?next=%2Fadmin` |
| `app/admin/login/page.js` | https://vibinapparel.com/admin/login | Also under the `/admin` middleware gate, so a signed-out visitor was sent to `/login?next=/admin/login`. Client `signInWithPassword` + `is_admin` check. No custom login API, no extra IP rate limit (Supabase Auth still rate-limits). | **307** → `/login?next=%2Fadmin%2Flogin` |
| `app/admin/orders/page.js` | https://vibinapparel.com/admin/orders | Middleware only on the page. Data via `GET /api/admin/orders` (`requireAdmin()`). Showed id, email, total, date, status, items, tracking, ambassador, shipping address. No refunds. | **307** → `/login?next=%2Fadmin%2Forders` |
| `app/admin/support/page.js` + `SupportThreads.js` | https://vibinapparel.com/admin/support | Middleware on the page; `GET/POST/PATCH /api/admin/support` uses `requireAdmin()`. This is the support-queue ticket UI. | **307** → login |
| `app/admin/back-in-stock/page.js` | https://vibinapparel.com/admin/back-in-stock | Middleware + `GET /api/admin/back-in-stock` (`requireAdmin()`). | **307** → login |
| `app/admin/products/page.js`, `new/page.js`, `[id]/edit/page.js` | https://vibinapparel.com/admin/products (and /new, /[id]/edit) | Middleware only. Pages talk to Supabase from the browser with the **anon** key (`app/lib/supabase.js`). Relies on RLS. No admin API. | **307** → login |
| `app/admin/ambassadors/page.js` | https://vibinapparel.com/admin/ambassadors | Middleware + client `getSession` / `is_admin`, then browser writes to `ambassadors` and `profiles.is_ambassador`. Relies on RLS. | **307** → login |
| `app/admin/email/page.js` | https://vibinapparel.com/admin/email | Middleware + client `is_admin`, then browser reads `vibin_signups` / `ambassadors`. Relies on RLS. | **307** → login |
| `app/admin/payouts/page.js` | https://vibinapparel.com/admin/payouts | Middleware + client `is_admin`, then browser reads/writes payout tables. Relies on RLS. | **307** → login |
| `app/admin/requisitions/page.js` | https://vibinapparel.com/admin/requisitions | Middleware. Server component, "Coming soon", already had `robots: noindex`. No data. | **307** → login |
| `app/admin/security/page.js` | https://vibinapparel.com/admin/security | Same as requisitions. | **307** → login |
| `app/api/admin/orders/route.js` | https://vibinapparel.com/api/admin/orders | `requireAdmin()` (session `getUser` + `profiles.is_admin`). **Not** in the middleware matcher. `GET` used `select('*')`. Service-role after the check. | **403** `{"error":"Forbidden"}` |
| `app/api/admin/support/route.js` | https://vibinapparel.com/api/admin/support | `requireAdmin()` first, then service-role. | **403** |
| `app/api/admin/back-in-stock/route.js` | https://vibinapparel.com/api/admin/back-in-stock | `requireAdmin()` first, then service-role. | **403** |
| `public/admin/orders.html` | https://vibinapparel.com/admin/orders.html | Legacy stub (`noindex`, meta refresh to `/admin/orders`). Middleware still 307s it to login. No data, no keys. | **307** → login |
| `public/admin/products.html` | https://vibinapparel.com/admin/products.html | Same pattern, refresh to `/admin/products`. | **307** → login (same class of URL) |
| `app/support-agent/page.js` | https://vibinapparel.com/support-agent | **Not** in middleware. Client-only admin check. Links to `/admin`. HTML is public. Data is RLS-gated. Documented in the Nov 20 security audit, gap E. | **200** HTML (confirmed again today) |

**Who can get in (cabbb89):** a Supabase Auth user whose `profiles.is_admin` is true. There was no email allowlist. `profiles_guard_role_flags` (applied) stops a non-admin from setting `is_admin` on themselves. Admin sign-in is Supabase Auth (`signInWithPassword`) on `/login` or `/admin/login`.

**What a signed-out visitor can reach:** not the admin HTML (307) and not the admin APIs (403). They **can** load `/support-agent` HTML (200). They cannot read admin API data without a session. Live `orders_rls_lockdown` is applied (the "NOT yet applied" comment in that SQL file is stale — see the security audit).

**Sitemap / nav / robots (live):** `robots.txt` disallows `/admin/` and `/api/`. `sitemap.xml` does **not** list any `/admin` URL. Public site nav does not link to `/admin`. `app/support-agent/page.js` has an "Admin" link. No `X-Robots-Tag` on these responses. `Cache-Control` was `public, max-age=0, must-revalidate` (not `no-store`). Most admin pages had no `robots` metadata (exceptions: requisitions, security, the legacy HTML stubs).

**Service-role key:** on cabbb89 it is only read in server routes, server helpers, scripts, and the `/drop/01` server component. No `'use client'` file reads `SUPABASE_SERVICE_ROLE_KEY`. That remains true on this branch (tested).

## 2. Auth gaps found (cabbb89) and the fix on this branch

### Gap 1 — Admin pages were not server-component gated
- **Where:** every `app/admin/**/page.js` except requisitions/security; no `app/admin/layout.js`. Client checks e.g. `app/admin/page.js:13-31` (`getSession()`, not `getUser()`). Middleware `middleware.js:27-75` was the only server gate for HTML.
- **Risk:** a client `useEffect` can race data loads (the dashboard's `fetchData` ran in a separate effect and did not wait for the auth check). Middleware-only gating is weaker than a server layout (`requireAdmin` + redirect).
- **Fix:** `app/admin/layout.js` is a server layout, `dynamic = 'force-dynamic'`, `robots: noindex,nofollow`, calls `requireAdmin()` and redirects to `/admin/login` unless the path is `/admin/login`.

### Gap 2 — No email allowlist
- **Where:** `app/lib/admin-auth.js:33-38` and `middleware.js:61-71` checked only `profiles.is_admin`.
- **Risk:** anyone with the admin flag (or a future flag mistake) gets the whole admin surface. Defense in depth was missing.
- **Fix:** env var **`ADMIN_EMAILS`** (comma/whitespace-separated). `requireAdmin()` and middleware also check `isAllowlistedEmail()`. If the var is unset or empty, the allowlist is skipped so current admins are not locked out until Josias approves the env change. Name only; the value is never logged.

### Gap 3 — No `noindex` / `no-store` on most admin routes
- **Where:** no admin layout metadata; middleware set no security headers. Live responses had no `X-Robots-Tag` and used `Cache-Control: public, max-age=0, must-revalidate`.
- **Risk:** a cached or indexed admin shell, or a CDN serving a stale 200.
- **Fix:** layout metadata plus middleware headers `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store, no-cache, must-revalidate, private` on `/admin`, `/api/admin`, and `/support-agent`. Still not linked from the public nav or the sitemap.

### Gap 4 — `/admin/login` was not reachable signed-out; no extra rate limit
- **Where:** `middleware.js` treated `/admin/login` like any other admin path (live 307 to `/login`). `app/admin/login/page.js:18-21` called `signInWithPassword` in the browser. No custom login route to cap.
- **Risk:** no additional IP limit at our edge (Supabase Auth still rate-limits). The dedicated login page was effectively unused for signed-out CS.
- **Fix:** middleware exempts `/admin/login`. New `POST /api/admin/login` uses the existing `createRateLimiter` (5 attempts / 15 minutes / IP), then Supabase Auth, then `is_admin` + `ADMIN_EMAILS`, and signs out on failure. The login page posts to that route. Supabase Auth rate limits still apply.

### Gap 5 — `/api/admin/orders` returned every column
- **Where:** `app/api/admin/orders/route.js:13-16` (`select('*')`). The dashboard also used `app/admin/page.js:68-71` (`from('orders').select('*')` in the browser).
- **Risk:** CS (or any admin session, or XSS in the admin app) received `stripe_session_id`, notes, commission, etc. No card columns exist on `orders`, but that is more than CS needs. The dashboard bypassed the API entirely.
- **Fix:** `GET`/`PATCH` project through `presentOrderForCs()` (`CS_ORDER_FIELDS` plus refund summaries). Shipping address stays only because fulfillment needs it. The dashboard now calls `/api/admin/orders`.

### Gap 6 — `/support-agent` was public HTML
- **Where:** `middleware.js:27-28, 77-82` (not listed). `app/support-agent/page.js`, live **200**. Security audit gap E.
- **Risk:** the admin chrome and a link to `/admin` are public. Rows are RLS-gated, but the page should be server-gated like `/admin`.
- **Fix:** middleware matcher + `is_admin` / allowlist, and a server layout `app/support-agent/layout.js` (`requireAdmin`, noindex, `force-dynamic`).

### Residual (listed, not fully rewritten)
Products, ambassadors, email, and payouts still talk to Supabase from the browser under RLS after the user has loaded the (now server-gated) page. An `is_admin` user who is **not** on `ADMIN_EMAILS` cannot load those pages through middleware/layout, but could still call Supabase from the console if they already have a session. Moving those pages onto `/api/admin/*` is a follow-up. The service-role key still does not ship to the client.

## 3. Refund handler (this branch)

`app/api/webhook/route.js` already verified `stripe-signature` on cabbb89 and handled `checkout.session.completed` / `checkout.session.expired`. It did **not** handle `charge.refunded`.

This branch, after signature verification:

1. On `checkout.session.completed`, also stores `stripe_payment_intent_id` when the column exists (same retry pattern as `total_amount` if the migration is not applied yet).
2. On `charge.refunded`, `handleChargeRefunded()` (`app/lib/order-refunds.mjs`) finds the order (metadata `orderId`, then `stripe_payment_intent_id`, then session id), upserts `order_refunds` (idempotent on `stripe_event_id`), and — under option A — opens a support-queue ticket. Email is drafted, not sent.
3. `/admin/orders` shows, in ET (America/New_York): order id, date, customer email, total, refund amount, refund status, Stripe event time. Expanded row still has items, tracking, and ship-to for fulfillment. No card data.

**Stripe endpoint:** the handler only runs if the Vibin Stripe webhook is subscribed to `charge.refunded` (test mode, per standing rules). That dashboard change is not in this branch. A previous connector check saw only PropScav accounts; do not enable this on the wrong Stripe account.

**Yes 1 / Yes 2 (held on another branch):** Yes 1 already has a `charge.refunded` path that calls `refund_pieces` for numbered tees/snapbacks, and Yes 2 is the DB step for that. Those packages are separate and still held. This handler records the CS refund and ticket only. When both ship, the two `charge.refunded` blocks should be merged so one event both updates numbered pieces and inserts `order_refunds`. This migration file is named `20261120120000_*` so it does not collide with Yes 2's `20261120000001_*`.

## 4. Security-audit cross-check

`/workspace/vibin-store-audit/security-audit-nov20.md` reported: unauthenticated `/api/notify`, unauthenticated `/api/redeem` (spend-by-email), Origin-based checkout return URLs, and no CSP, plus `/support-agent` not in middleware.

This branch **adds no new instance** of the notify, redeem, Origin-return, or CSP issues. It does not change those routes. It **does** close the `/support-agent` middleware/layout hole (audit gap E) and leaves the security-fixes draft patch as its own held package.

## 5. Results (Fri Nov 20, 2026, 10:52 AM ET)

- Tests: `node --test tests/*.test.mjs` — **212/212** pass (10 new in `tests/admin-orders-refunds.test.mjs`).
- Build: `next build` (Next 16.2.4 Turbopack) — **PASS**. `/admin/*`, `/api/admin/*`, and `/support-agent` are dynamic (`ƒ`). Placeholder env in the shell only.
- Nothing pushed or deployed.

## 6. Asks (separate yeses; no merge or deploy in the same yes)

1. Yes to open this branch as a **draft PR only** (or keep it local).
2. A separate yes to **apply** `20261120120000_order_refunds_cs.sql`.
3. A separate yes (env change) to set **`ADMIN_EMAILS`** in Vercel.
4. A separate yes to enable **`charge.refunded`** on Vibin Apparel's own Stripe webhook (test mode), after the account is confirmed as Vibin's, not PropScav or GreenWire/Pulse.
5. A later yes if the drafted refund email should be turned on (`REFUND_EMAIL_ALERT`).
