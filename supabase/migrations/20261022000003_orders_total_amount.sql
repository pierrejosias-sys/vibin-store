-- Amount actually charged by Stripe (session.amount_total, incl. tax/shipping),
-- written by /api/webhook and shown on the ambassador dashboard.
-- `total` remains the cart subtotal computed at checkout.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Backfill so existing paid orders show something on the ambassador dashboard.
UPDATE public.orders SET total_amount = total
 WHERE total_amount IS NULL AND status IN ('paid', 'shipped', 'delivered');
