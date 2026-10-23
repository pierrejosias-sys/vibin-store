-- ═══════════════════════════════════════════════════════════════════
-- Orders RLS lockdown
-- Replaces "Admins manage orders" (FOR ALL USING (true)), which let anyone
-- with the public anon key read/modify every order.
--
-- After this migration:
--   • customers   SELECT own orders (user_id = auth.uid() or JWT email match)
--   • ambassadors SELECT orders carrying their referral code (unchanged rule)
--   • admins      (profiles.is_admin) SELECT / UPDATE / DELETE all orders
--   • INSERT only via service role (/api/checkout); service role bypasses RLS
-- NOT yet applied to production.
-- ═══════════════════════════════════════════════════════════════════

-- SECURITY DEFINER so policies don't depend on profiles' own RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins read orders" ON public.orders;
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
DROP POLICY IF EXISTS "Customers read own orders" ON public.orders;

CREATE POLICY "Customers read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (customer_email IS NOT NULL
        AND lower(customer_email) = lower(auth.jwt() ->> 'email'))
  );

CREATE POLICY "Admins read orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete orders" ON public.orders
  FOR DELETE TO authenticated USING (public.is_admin());

-- "Ambassadors can view own referred orders" (exists in prod) is kept as-is.
-- No INSERT policy: orders are created by /api/checkout with the service role.
REVOKE INSERT ON public.orders FROM anon;
