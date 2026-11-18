-- "Notify me when back in stock" sign-ups, per product and per size (and colour when the product has colourways).
-- Kept separate from waitlist_signups on purpose: this is not the Drop 01 list and is never synced to it.
-- NOT yet applied to production. Review, then apply.
CREATE TABLE IF NOT EXISTS public.back_in_stock_signups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL CHECK (char_length(email) <= 254),
  product_id   BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size         TEXT NOT NULL DEFAULT '' CHECK (char_length(size) <= 12),   -- '' = any size / one size
  color        TEXT NOT NULL DEFAULT '' CHECK (char_length(color) <= 40),  -- '' = no colourway chosen
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notify_claimed_at TIMESTAMPTZ,              -- send in progress (claim; stops two senders racing)
  notified_at  TIMESTAMPTZ,                   -- set once, after the one back-in-stock email went out
  notify_error TEXT
);

-- One sign-up per email per product/size/colour. Signing up again is a no-op, so nobody gets two emails.
CREATE UNIQUE INDEX IF NOT EXISTS back_in_stock_signups_unique
  ON public.back_in_stock_signups (lower(email), product_id, size, color);
-- Fast "who is still waiting on this product" lookups.
CREATE INDEX IF NOT EXISTS back_in_stock_signups_waiting_idx
  ON public.back_in_stock_signups (product_id, size) WHERE notified_at IS NULL;

-- Server-only: RLS on with NO policies, and no grants to anon/authenticated.
-- Writes go through /api/back-in-stock and reads through /api/admin/back-in-stock (admin check), both with the service role.
ALTER TABLE public.back_in_stock_signups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.back_in_stock_signups FROM anon, authenticated;
