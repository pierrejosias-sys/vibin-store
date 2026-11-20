-- ═══════════════════════════════════════════════════════════════════
-- Order refunds for CS (/admin/orders) + charge.refunded webhook
-- HELD. Not applied. Needs its own yes from Josias before running
-- against grbwnjnngzcsjlubcmtp.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_intent
  ON public.orders (stripe_payment_intent_id);

CREATE TABLE IF NOT EXISTS public.order_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id BIGINT NOT NULL REFERENCES public.orders(id),
  stripe_event_id TEXT NOT NULL UNIQUE,
  stripe_charge_id TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('refunded', 'partial', 'none')),
  stripe_event_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_refunds_order_id
  ON public.order_refunds (order_id, stripe_event_at);

ALTER TABLE public.order_refunds ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: deny by default. The admin API and
-- the Stripe webhook use the service role, which bypasses RLS.

REVOKE ALL ON public.order_refunds FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.order_refunds TO service_role;
