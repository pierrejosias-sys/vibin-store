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

**Default routing (no `PRINTFUL_VARIANT_MAP` needed):** `hd:<size>` → Black catalog variant above with ONE file
(back left empty): `{type:"front_dtf", url, position}`.
* **Art (Design-approved):** `public/print/d01-hd-chest-mark-2.75in.png`, live at
  `https://vibinapparel.com/print/d01-hd-chest-mark-2.75in.png`. It's a copy of
  `design/print-ready/hoodie-ls17001/chest-mark-2.75in.png`: 825×210 px @ 300 DPI, transparent, "VIBIN." + star in #84754E.
  Override it with `PRINTFUL_HOODIE_FILE_URL`.
* **Placement:** wearer's left chest (the viewer's right on the front). The mark is 2.75 in wide, its center sits 3.5 in from the
  print-area center, and its top edge is 3.0 in from the top of the area. `hoodieChestPosition()` computes it from env:

| Env | Default | Meaning |
|---|---|---|
| `PRINTFUL_HOODIE_AREA_W` | 3600 | front_dtf printfile width, px |
| `PRINTFUL_HOODIE_AREA_H` | 4800 | front_dtf printfile height, px |
| `PRINTFUL_HOODIE_AREA_DPI` | 300 | printfile DPI |

  The default position is
  `{"area_width":3600,"area_height":4800,"width":825,"height":210,"top":900,"left":2438,"limit_to_print_area":true}`.
  It is identical to Design's placed canvas `front_dtf-leftchest-placed.png` (12×16 in).
  **Unverified:** "top 3.0 in from the area top" is treated as "about 3 in below the collar seam". Check it on the first draft's mockup.
* **Replace the defaults with real values** once the token exists:
  1. Run `curl -s https://api.printful.com/mockup-generator/printfiles/1540 -H "Authorization: Bearer <token>"`.
  2. In `variant_printfiles[]`, find the entry for variant 48520 and its `placements.front_dtf` printfile id.
  3. In `printfiles[]`, look up that id to get its `width`, `height` and `dpi`.
  4. Set `PRINTFUL_HOODIE_AREA_W`, `PRINTFUL_HOODIE_AREA_H` and `PRINTFUL_HOODIE_AREA_DPI` to those numbers in Vercel (Production), then redeploy.
     The mark keeps its physical size and offsets.
  5. If you want an exact hand-set box instead, set `PRINTFUL_HOODIE_FILE_POSITION`. It overrides everything else.

### Print areas (NOT yet retrieved)
`GET https://api.printful.com/mockup-generator/printfiles/1540` (and the v2 catalog endpoints) need a token. Without one they return 401.
The public v1 catalog lists these placements: `front_dtf`, `back_dtf`, `long_sleeve_left_dtf`, `long_sleeve_right_dtf`, `label_inside_dtf`,
plus embroidery-only `embroidery_chest_left/right/center` and `embroidery_wrist_left/right`.
**There is no DTF chest-left placement.** The DTF chest mark therefore goes in `front_dtf` with a computed `position` (above).
After creating the token, run:
`curl -s https://api.printful.com/mockup-generator/printfiles/1540 -H "Authorization: Bearer <token>"`
In the response, `printfiles[]` gives width/height px and dpi, and `variant_printfiles` maps placements to printfile ids.

### No inserts
The hoodie ships with no certificate or QR insert. The order payload sends no packing_slip, gift or insert data (covered by a test).

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
