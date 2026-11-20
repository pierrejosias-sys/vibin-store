-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- Made-to-order (Printful POD) product type — NOT APPLIED. Draft only (Nov 20, 2026).
-- Needs its own yes before anyone runs it against grbwnjnngzcsjlubcmtp.
--
-- Adds columns to public.products. Every existing row defaults to fulfillment='standard', numbered=NULL, so
-- nothing on the live shop changes. A POD row is fulfillment='printful_pod' AND numbered=false.
-- POD rows are never seeded into public.pieces, never go through claim_pieces(), and never count toward the
-- 50-per-style Drop 01 cap: the cap only exists for drop_styles/pieces (d01 te/sb), which this file doesn't touch.
-- Also: a published flag (drafts hidden by RLS) and column-level lockdown of printful_variants.
-- orders already has printful_order_id / printful_status / fulfillment_status / printful_error
-- (20261023000003_orders_printful_fulfillment.sql), so no orders change is needed.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fulfillment       TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS numbered          BOOLEAN,
  ADD COLUMN IF NOT EXISTS printful_variants JSONB,     -- { "<size>": <sync_variant_id> | {"variant_id": n, "files": [...]} }
  ADD COLUMN IF NOT EXISTS ship_days         INTEGER,   -- business days to ship; NULL = site default (7, Legal-approved copy)
  ADD COLUMN IF NOT EXISTS ships_separately  BOOLEAN NOT NULL DEFAULT false, -- true for caps: own Printful package, full first-item rate each
  ADD COLUMN IF NOT EXISTS ship_first_rate   NUMERIC(8,2),  -- POD: customer-paid first-item US shipping, Printful standard (base, without the holiday surcharge)
  ADD COLUMN IF NOT EXISTS ship_addon_rate   NUMERIC(8,2),  -- POD: each additional unit in the same package.                PENDING FINANCE
  ADD COLUMN IF NOT EXISTS size_prices       JSONB,         -- POD per-size price overrides, e.g. {"2XL": 75}; others use price
  ADD COLUMN IF NOT EXISTS published         BOOLEAN NOT NULL DEFAULT true; -- false = draft, hidden from the public (RLS below)

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_fulfillment_check;
ALTER TABLE public.products ADD CONSTRAINT products_fulfillment_check
  CHECK (fulfillment IN ('standard', 'printful_pod'));

-- A POD product can never be numbered.
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_pod_unnumbered_check;
ALTER TABLE public.products ADD CONSTRAINT products_pod_unnumbered_check
  CHECK (fulfillment <> 'printful_pod' OR numbered = false);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_ship_days_check;
ALTER TABLE public.products ADD CONSTRAINT products_ship_days_check CHECK (ship_days IS NULL OR ship_days > 0);

CREATE INDEX IF NOT EXISTS idx_products_fulfillment ON public.products(fulfillment) WHERE fulfillment <> 'standard';

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_ship_rates_check;
ALTER TABLE public.products ADD CONSTRAINT products_ship_rates_check
  CHECK ((ship_first_rate IS NULL OR ship_first_rate >= 0) AND (ship_addon_rate IS NULL OR ship_addon_rate >= 0));

-- Draft (unpublished) products: only admins see them. Live policy today is "Public can view products" USING (true).
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products
  FOR SELECT USING (published OR public.is_admin());

-- printful_variants (internal Printful ids) is not readable through the public API (anon / authenticated).
-- Column privileges: revoke table-wide SELECT, then grant every other column. The service role (checkout,
-- the Printful draft route) is unaffected. NOTE: a column added later must be added to this grant.
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, name, price, category, color, image_color, description, in_stock, created_at, slug, stock_qty,
              compare_price, images, is_featured, tags, image_url,
              fulfillment, numbered, size_prices, ship_days, ships_separately, ship_first_rate, ship_addon_rate, published)
  ON public.products TO anon, authenticated;
