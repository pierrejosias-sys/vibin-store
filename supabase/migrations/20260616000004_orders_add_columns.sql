-- Add missing columns to orders table
-- tracking_number, notes, referral_code, customer_name, subtotal_price

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS subtotal_price DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON public.orders(referral_code);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
