# Printful print-on-demand setup (VOL 01 Hoodie)

When Stripe sends `checkout.session.completed` for a **paid** session, `/api/webhook`
calls `fulfillWithPrintful()` (`app/lib/printful.js`). It sends the cart's POD lines
to Printful. **Only the Drop 01 VOL 01 Hoodie (drop style `hd`, $195, S–3X) is print-on-demand**
(allow-list `PRINTFUL_PRODUCTS` in `app/lib/printful-core.mjs`); the Foundation Tee and
Snapback are fulfilled in-house and are never sent, even if they appear in the map and records the result on
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

## Product: Lane Seven LS17001 (Printful catalog product 1540)
"Unisex Super Heavyweight Hoodie | Lane Seven LS17001". It's 16.5 oz (560 g/m²) 65/35 cotton/poly, raglan, with a double-layer hood **without drawstrings**.
Techniques: DTF film or embroidery. Print placement used: `front_dtf`.
Source: `GET https://api.printful.com/products/1540` (public, no auth), Oct 23, 2026.

| Size | Black variant id | Printful base price (USD) |
|---|---|---|
| S | 48514 | 39.73 |
| M | 48520 | 39.73 |
| L | 48526 | 39.73 |
| XL | 48532 | 39.73 |
| 2X (2XL) | 48538 | 41.73 |
| 3X (3XL) | 48544 | 43.73 |

Other colors: Arona, Asphalt, Chocolate Brown, Cream and Moss Gray. Each has an XS–3XL run (e.g. Cream M = 48522).
XS is not sold.

**Default routing (no `PRINTFUL_VARIANT_MAP` needed):** `hd:<size>` goes to the Black catalog variant above. It carries one
file `{type:"front_dtf", url: PRINTFUL_HOODIE_FILE_URL}`. The default URL is
`https://vibinapparel.com/print/d01-hd-front-01-columns-chest-4in.png`.
**Art (UNCONFIRMED):** that file is Design's "01 Columns" chest hit (1200×1200 px, 4 in @300 DPI, transparent, cream/gold).
The Drop 01 graphics README calls it the "hoodie hero". The hoodie tech pack (Rev 0.5) still specifies a small embroidered
left-chest wordmark, and its back art is "pending owner pick". So no front art is formally approved for DTF yet.
Confirm or replace the file before turning on `PRINTFUL_CONFIRM`.
Without a `position`, Printful scales the file to fill the front print area. For a 4 in chest hit, set
`PRINTFUL_HOODIE_FILE_POSITION` (JSON, Printful v1 file position:
`{"area_width":…,"area_height":…,"width":…,"height":…,"top":…,"left":…}`).
Get the numbers from Printful's design maker. The simpler route is to build the product in Printful's dashboard and
put its **sync variant ids** in `PRINTFUL_VARIANT_MAP` (`{"hd:S":<sync id>,…}`). That overrides the default entirely.

## Checklist for Josias


### 1. Migrations (already applied Oct 23, 2026)
Run `supabase/migrations/20261023000003_orders_printful_fulfillment.sql` against production
(Supabase SQL editor or `supabase db push`). Do this **before** setting `PRINTFUL_API_TOKEN`.
Until you set the token, the integration does nothing.

### 2. Printful store
In Printful, add a store for vibinapparel.com (type "Manual order platform / API").
Optionally, build the LS17001 hoodie there as a product with the approved art, and use its sync variant ids (see above).

### 3. Create a private token
1. Open https://developers.printful.com/tokens and log in.
2. Choose "Add new token".
3. Set the access level to the vibinapparel.com store.
4. Select these scopes: **orders**, **products** (sync products), **file library**, **webhooks**. Read+write.
5. Copy the token immediately. It is shown once and has an expiry date.

### 4. Find the store id
`curl -s https://api.printful.com/stores -H "Authorization: Bearer <token>"`, then read `result[].id`.

### 5. Vercel environment variables
1. Open https://vercel.com/team_4QgnaZOcozdgjGoDhf0EwX7T/vibin-store/settings/environment-variables
2. Add these with the **Production** environment selected:

| Name | Value |
|---|---|
| `PRINTFUL_API_TOKEN` | the token from step 3 |
| `PRINTFUL_STORE_ID` | the store id from step 4 |
| `PRINTFUL_CONFIRM` | (optional) leave unset or `false`. Orders land as **drafts** you confirm in Printful. Set `true` only after a test order looks right. |
| `PRINTFUL_WEBHOOK_SECRET` | (optional) long random string, for tracking updates (step 7) |
| `PRINTFUL_HOODIE_FILE_URL` / `PRINTFUL_HOODIE_FILE_POSITION` | (optional) override the print file / placement |
| `PRINTFUL_VARIANT_MAP` | (optional) sync variant ids, overrides the default LS17001 mapping |

3. **Redeploy:** Deployments → latest Production deployment → ⋯ → Redeploy. Env changes apply only to new deployments.
   Until `PRINTFUL_API_TOKEN` is set, the integration does nothing.

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
Keep `PRINTFUL_CONFIRM=false` and place a real order for one VOL 01 Hoodie (when the pre-order is open). Then check:
* A draft order `vibin-<orderId>` appears in Printful → Orders.
* The order row has `printful_order_id` set and `fulfillment_status = printful_draft`.
* In Stripe, "Resend" the event. There should still be one Printful order.

Delete the draft in Printful. Once a test order looks right, flip `PRINTFUL_CONFIRM=true`.

## Fulfillment statuses
`null` → `printful_submitting` → `printful_draft` | `printful_confirmed` → `shipped`.
Error or hold states: `printful_failed` (retryable), `printful_needs_mapping` (fix the map, then reset the
column to null and resend the Stripe event), and `printful_canceled`.
