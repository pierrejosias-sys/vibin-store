-- Security fixes Nov 20 (advisor lints 0011, 0028, 0029).
-- Trigger functions: Postgres does not check EXECUTE when a trigger fires, so revoking it from the
-- Data API roles is safe and stops /rest/v1/rpc/<fn> calls.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_guard_role_flags() FROM PUBLIC, anon, authenticated;

-- is_admin() is used only by RLS policies scoped TO authenticated, so anon does not need it.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Fixed search_path for the auth.users signup trigger (lint 0011).
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-- Left callable on purpose: drop_inventory and piece_by_tag (storefront / tag lookups).
