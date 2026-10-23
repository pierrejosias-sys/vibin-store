# Printful print-on-demand setup (Foundation Tee)

When Stripe sends `checkout.session.completed` for a **paid** session, `/api/webhook`
calls `fulfillWithPrintful()` (`app/lib/printful.js`). It sends the cart's POD lines
(currently the Foundation Tee, black, S–3X) to Printful and records the result on
the `orders` row. Everything else in the cart is left for manual fulfillment and
listed in `orders.printful_error` ("Manual fulfillment needed for: …").

* API: Printful **v1** `POST https://api.printful.com/orders`. We use v1 because v2
  (still beta) has no sync-product support yet, and a v2 order can't be created
  already confirmed.
* Orders are created as **drafts** unless `PRINTFUL_CONFIRM=true`. With that set we
  call `?confirm=true`, and Printful charges your billing method and starts production.
* Idempotency works at three levels:
  1. The row's `printful_order_id` / `fulfillment_status` must still be unset.
  2. An atomic conditional UPDATE claims the row (`printful_submitting`).
  3. We look up the order on Printful by external id (`vibin-<orderId>`) before creating it.
  Because of this, Stripe retries never create a second Printful order.
* Printful failures never fail the Stripe webhook. They are saved as
  `fulfillment_status = printful_failed` along with `printful_error`. The next delivery of
  the same event retries, and Stripe's "Resend" button in the Dashboard works for this.

## Checklist for Josias

### 1. Apply the migration
Run `supabase/migrations/20261023000003_orders_printful_fulfillment.sql` against production
(Supabase SQL editor or `supabase db push`). Do this **before** setting `PRINTFUL_API_TOKEN`.
Until you set the token, the integration does nothing.

### 2. Create the Printful product (Logistics)
In Printful, add a store for vibinapparel.com (type "Manual order platform / API").
Then create the Foundation Tee product in black, sizes S, M, L, XL, 2XL, 3XL, with the design files.
Each size becomes a **sync variant**, which has its own id.

### 3. Create a private token
* Go to https://developers.printful.com/tokens ("Your tokens" in the Developer Portal;
  log in at https://developers.printful.com/login). Use "Add new token":
  https://developers.printful.com/tokens/add-new-token
* Access level: **the vibinapparel.com store** (a store-level token). If you pick an
  account-level token instead, you must set `PRINTFUL_STORE_ID`.
* Scopes:
  * `orders` (read/write)
  * `sync_products/read`, used to look up the variant ids
  * `webhooks` (read/write), used to register the webhook below
* Copy the token right away, because Printful only shows it once. Note the expiry
  date, too. Private tokens expire and must be replaced by hand.

### 4. Find the sync variant ids
```bash
curl -s https://api.printful.com/store/products -H "Authorization: Bearer $PRINTFUL_API_TOKEN"
curl -s https://api.printful.com/store/products/<sync_product_id> -H "Authorization: Bearer $PRINTFUL_API_TOKEN"
# -> result.sync_variants[].id  (with .size / .name)
```
Add `-H "X-PF-Store-Id: <id>"` if the token is account-level. To get the store id, run
`curl -s https://api.printful.com/stores -H "Authorization: Bearer …"`.

### 5. Vercel environment variables
Go to Vercel → project **vibin-store** → Settings → Environment Variables
(https://vercel.com/dashboard → vibin-store → Settings → Environment Variables).
Set these for Production, and for Preview if you want to test there:

| Name | Value |
|---|---|
| `PRINTFUL_API_TOKEN` | the private token from step 3 |
| `PRINTFUL_STORE_ID` | numeric store id (needed only for account-level tokens, but harmless otherwise) |
| `PRINTFUL_CONFIRM` | `false` to start (orders land as drafts you confirm in Printful). Set it to `true` only after a test order looks right. |
| `PRINTFUL_WEBHOOK_SECRET` | a long random string, e.g. `openssl rand -hex 32` |
| `PRINTFUL_VARIANT_MAP` | JSON, see below |

`PRINTFUL_VARIANT_MAP`: keys are `<product id or slug>:<size>`. The Foundation Tee is
product id `1` in the `products` table. Sizes `2XL`/`XXL` normalize to `2X`, and `3XL`/`XXXL` to `3X`.
Use a value of `0` as a placeholder. A POD item with a placeholder is **not** sent. Instead the
order gets `fulfillment_status = printful_needs_mapping`.
```json
{"1:S":0,"1:M":0,"1:L":0,"1:XL":0,"1:2X":0,"1:3X":0}
```
Replace each `0` with the sync variant id. You can also use a catalog variant plus print files:
`"1:M":{"variant_id":4017,"files":[{"url":"https://…/front.png"}]}`.
After changing env vars, redeploy.

### 6. Stripe webhook events
Go to Stripe Dashboard → Developers → Webhooks (https://dashboard.stripe.com/webhooks).
The endpoint `https://vibinapparel.com/api/webhook` must listen to at least:
* `checkout.session.completed`
* `checkout.session.expired`

`STRIPE_WEBHOOK_SECRET` stays unchanged. Checkout now collects a **US-only shipping
address** (`shipping_address_collection`), and that address is what Printful ships to.

### 7. Register the Printful webhook
Printful v1 webhooks are not signed, so the shared secret goes in the URL:
```
https://vibinapparel.com/api/printful/webhook?secret=<PRINTFUL_WEBHOOK_SECRET>
```
Register it with the token. The call below replaces any existing webhook config for the store:
```bash
curl -s -X POST https://api.printful.com/webhooks \
  -H "Authorization: Bearer $PRINTFUL_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"url":"https://vibinapparel.com/api/printful/webhook?secret=<SECRET>","types":["package_shipped","order_failed","order_canceled"]}'
```
When `package_shipped` arrives, the route sets `status = shipped`, `fulfillment_status = shipped`,
`tracking_number`, `tracking_url`, `carrier` and `shipped_at`.

### 8. Test
Keep `PRINTFUL_CONFIRM=false` and place a real order for one Foundation Tee. Then check:
* A draft order `vibin-<orderId>` appears in Printful → Orders.
* The order row has `printful_order_id` set and `fulfillment_status = printful_draft`.
* In Stripe, "Resend" the event. There should still be one Printful order.

Delete the draft in Printful. Once a test order looks right, flip `PRINTFUL_CONFIRM=true`.

## Fulfillment statuses
`null` → `printful_submitting` → `printful_draft` | `printful_confirmed` → `shipped`.
Error or hold states: `printful_failed` (retryable), `printful_needs_mapping` (fix the map, then reset the
column to null and resend the Stripe event), and `printful_canceled`.
