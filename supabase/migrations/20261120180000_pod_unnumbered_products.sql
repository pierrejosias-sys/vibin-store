-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- Made-to-order (Printful POD) product type — NOT APPLIED. Draft only (Nov 20, 2026).
-- Needs its own yes before anyone runs it against grbwnjnngzcsjlubcmtp.
--
-- Adds columns to public.products. Every existing row defaults to fulfillment='standard', numbered=NULL, so
-- nothing on the live shop changes. A POD row is fulfillment='printful_pod' AND numbered=false.
-- POD rows are never seeded into public.pieces, never go through claim_pieces(), and never count toward the
-- 50-per-style Drop 01 cap: the cap only exists for drop_styles/pieces (d01 te/sb), which this file doesn't touch.
-- orders already has printful_order_id / printful_status / fulfillment_status / printful_error
-- (20261023000003_orders_printful_fulfillment.sql), so no orders change is needed.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fulfillment       TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS numbered          BOOLEAN,
  ADD COLUMN IF NOT EXISTS printful_variants JSONB,     -- { "<size>": <sync_variant_id> | {"variant_id": n, "files": [...]} }
  ADD COLUMN IF NOT EXISTS ship_days         INTEGER,   -- business days to ship; NULL = site default (7, Legal-approved copy)
  ADD COLUMN IF NOT EXISTS ships_separately  BOOLEAN NOT NULL DEFAULT false; -- true for caps: own Printful package, full first-item rate each

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

-- printful_variants is internal (Printful ids). The anon role already reads products; if that should
-- be hidden from the public API, revoke column-level SELECT in a follow-up (decision in REPORT.md).
