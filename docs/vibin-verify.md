# Vibin Verify

Hang-tag QR → `vibinapparel.com/verify?c=CODE` → "is this piece real?" + loyalty points.

- **Page:** `app/verify/page.js` (Muse's frontend, wired to the endpoints below). Authenticity needs no account; an email is only asked for when claiming or spending points.
- **API:** `app/api/verify/[code]/route.js`, `app/api/claim/route.js`, `app/api/redeem/route.js` (thin) → `app/lib/verify.mjs` (logic, unit-tested) → Postgres functions.
- **Database:** `supabase/migrations/20261118000001_vibin_verify.sql`. Tests: `tests/verify.test.mjs`.

## API

Codes look like `VBN-XXXX-XXXX` (A–Z / 0–9, case-insensitive; spaces and dashes are ignored). An unregistered code is **never** auto-created.

| Call | Success | Other |
| --- | --- | --- |
| `GET /api/verify/:code` | `200 { status: "authentic" \| "claimed", code, product, drop, colorway, size, points_value, claimed_at? }` | `404 { status: "not_found" }`. Side effect: `scan_count + 1`. |
| `POST /api/claim { code, account_or_email }` | `200 { status: "claimed", points_awarded, bonus_awarded, new_balance, claimed_at }` | `409 { status: "already_claimed", claimed_at }` (no points), `404`, `400` bad email |
| `POST /api/redeem { account, tier_id }` | `200 { status: "redeemed", reward_code, tier_id, label, points_spent, new_balance }` | `402 { status: "insufficient_points", balance, points_needed }`, `400` bad email / unknown tier |

`points_awarded` includes the +50 first-ever-verify bonus (`bonus_awarded` shows it separately). A claimed code still verifies as genuine; it just pays nothing again. Responses are `Cache-Control: no-store`. Rate limits (per server instance, best effort): 30 lookups, 10 claims and 10 redeems per IP per 10 minutes, plus 10 per email.

## Points

100 per piece, 150 for limited colorways, +50 on an account's first-ever claim. Points expire 12 months after they are earned (spent oldest-first).

| Tier | Cost | Reward |
| --- | --- | --- |
| `VIBIN10` | 200 | $10 off |
| `VIBIN25` | 400 | $25 off |
| `VIBIN50` | 750 | $50 off + early access to the next drop |

Costs live in `verify_reward_tiers`; the server never trusts a cost or a points value sent by the browser. A redeem returns a single-use code like `VIBIN10-7K3QX9M2PD`, tied to the account (`redemptions.used_at` is for checkout to set).

## Why claim and redeem are atomic

Each state change is **one Postgres function call = one transaction** (`verify_scan`, `verify_claim`, `verify_redeem`), called with the service role from the route handlers. No service key is ever in the browser or the repo.

- **Claim:** `UPDATE verify_codes SET claimed = true … WHERE code = $1 AND claimed = false`. A second simultaneous claim waits on the row lock, re-checks `claimed = false`, matches zero rows and gets `409`. A unique index (one `earn` ledger row per code) backs this up.
- **Redeem:** locks the `points_accounts` row first, so two taps on a 200-point balance can only ever buy one $10 reward; the balance can never go below zero.
- Invariant, always: `points_accounts.balance = SUM(points_ledger.points) = SUM(open lots' remaining)`.

## Security model

RLS is on for all five tables with **no policies**, and nothing is granted to `anon` / `authenticated`: the browser's anon key can neither read nor write `verify_codes` or anything else here. The functions are `SECURITY DEFINER` with a pinned `search_path` and executable by `service_role` only. `tests/verify.test.mjs` guards all of this.

## Operating it (SQL editor, as `postgres`)

**Generate a production batch** (a real Drop 01 batch is a separate step from this launch): one row per physical piece, random codes from an alphabet with no `0 O 1 I L`. Run once per product / colorway / size line, then export the codes for the tag printer. Check that the row count is what you asked for (a collision just yields one fewer row).

```sql
-- @generate_batch
INSERT INTO public.verify_codes (code, product, drop_name, colorway, size, points_value, batch_id)
SELECT 'VBN-' || substr(r, 1, 4) || '-' || substr(r, 5, 4),
       'Tech Shorts', 'Drop 01 SS26', 'Black / Gasoline Turquoise', 'L', 150, 'drop01-2026-11'
  FROM (SELECT public.verify_random_code(8) AS r FROM generate_series(1, 50)) s
ON CONFLICT (code) DO NOTHING;
```

**Demo codes** (batch `demo`: `VBN-TCH5-2601` Tech Shorts 150 pts, `VBN-HDE8-2601` Hoodie, `VBN-BRF3-2601` Boxer Briefs, `VBN-MDV9-2601` already claimed; `VBN-FAKE-0000` is deliberately not registered). They are public and they pay real points, so reset them after demos and retire them before tags ship.

Reset to a clean demo state. This wipes **all** points activity, so it refuses to run if any real code has been claimed:

```sql
-- @reset_demo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.verify_codes WHERE claimed AND batch_id IS DISTINCT FROM 'demo') THEN
    RAISE EXCEPTION 'real codes have been claimed: do not wipe points activity';
  END IF;
  DELETE FROM public.points_ledger WHERE true;
  DELETE FROM public.redemptions WHERE true;
  DELETE FROM public.points_accounts WHERE true;
  UPDATE public.verify_codes
     SET claimed = false, claimed_at = NULL, claimed_by = NULL, scan_count = 0, last_scan_at = NULL
   WHERE batch_id = 'demo' AND code <> 'VBN-MDV9-2601';
  UPDATE public.verify_codes
     SET claimed = true, claimed_at = '2026-11-12 12:00:00-05', claimed_by = 'demo-seed', scan_count = 0, last_scan_at = NULL
   WHERE code = 'VBN-MDV9-2601';
END $$;
```

Retire the demo batch (safe any time): unclaimed demo codes keep verifying as genuine but pay no points.

```sql
-- @retire_demo
UPDATE public.verify_codes
   SET claimed = true, claimed_at = now(), claimed_by = 'demo-seed'
 WHERE batch_id = 'demo' AND NOT claimed;
```

## Not done yet (read before real tags ship)

1. **Redeem is email-only and unverified.** Anyone who knows an email can redeem its points into reward codes, and the `402` response reveals its balance. Low risk today because checkout does not honor reward codes. Before it does, require a verified email (Supabase magic link / OTP) or a logged-in session.
2. **Demo codes are public and pay real points.** Run `@retire_demo` (and `@reset_demo` first if no real code has been claimed) before checkout honors `VIBIN*` codes. Also remove the demo chips from `app/verify/page.js` before tags ship.
3. **Checkout does not honor `VIBIN10/25/50` reward codes yet.** Redeeming issues a code; nothing consumes it.
4. **No balance-read endpoint.** The page shows the balance the server last reported (after a claim, a redeem or a `402`).
5. **Rate limiting is in memory**, per serverless instance. Move it to a shared store if abuse shows up.
6. **Production Drop 01 code batch** has not been generated or sent to the tag printer.
7. **Overlap with `/t/[tag]`** (the existing `pieces` / `piece_by_tag` hang-tag system and `data/drop01-hangtags.csv`): needs a product decision on which one the printed tags use.
8. `app/verify/metadata.js` is inert, like the other pages' `metadata.js` files (client page; a `layout.js` wrapper would activate it).
