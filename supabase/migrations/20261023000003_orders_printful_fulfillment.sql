-- Printful print-on-demand fulfillment state on orders.
-- Written only by server routes using the service role (/api/webhook, /api/printful/webhook);
-- existing RLS lockdown (20261022000002) is unchanged. NOT yet applied to production.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS printful_order_id   BIGINT,
  ADD COLUMN IF NOT EXISTS printful_status     TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_status  TEXT,  -- null | printful_submitting | printful_draft | printful_confirmed | printful_failed | printful_needs_mapping | printful_canceled | shipped
  ADD COLUMN IF NOT EXISTS printful_claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS printful_error      TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url        TEXT,
  ADD COLUMN IF NOT EXISTS carrier             TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at          TIMESTAMPTZ;

-- One Printful order per site order, and lookups from the Printful webhook.
CREATE UNIQUE INDEX IF NOT EXISTS orders_printful_order_id_key
  ON public.orders(printful_order_id) WHERE printful_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
