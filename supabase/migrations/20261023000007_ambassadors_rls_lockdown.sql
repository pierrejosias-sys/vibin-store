-- Security: 'Ambassadors view own' was USING (true) for role public, so anyone with the anon key could
-- read every application. 'Anyone can apply ambassador' was WITH CHECK (true), so anyone could insert a
-- row with status 'approved', any code and any commission_rate (the Stripe webhook pays commission on
-- approved codes). Applications now go through /api/ambassador/* with the service role.
DROP POLICY IF EXISTS "Ambassadors view own" ON public.ambassadors;
DROP POLICY IF EXISTS "Anyone can apply ambassador" ON public.ambassadors;

-- Signed-in applicant/ambassador sees only their own row (no user_id column; match the JWT email).
CREATE POLICY "Ambassadors view own row" ON public.ambassadors
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));
-- Admin read stays as-is: "Admins can read all ambassadors" (is_admin()).
-- No anon/public SELECT or INSERT policy remains, so RLS returns [] / denies for the anon key.
-- (Table grants are left alone: the orders/payouts policies sub-select ambassadors for every role.)
