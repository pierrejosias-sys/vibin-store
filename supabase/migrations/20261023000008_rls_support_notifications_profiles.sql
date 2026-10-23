-- Security: replace always-true SELECT policies and close profile privilege escalation.
-- Admin access is unchanged ("Admins manage ..." ALL policies using is_admin()).

-- support_chats: owner by email (no user_id column)
DROP POLICY IF EXISTS "Users view own chats" ON public.support_chats;
CREATE POLICY "Users view own chats" ON public.support_chats
  FOR SELECT TO authenticated
  USING (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'));

-- support_messages: messages of chats the caller owns
DROP POLICY IF EXISTS "Users view messages" ON public.support_messages;
CREATE POLICY "Users view own chat messages" ON public.support_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_chats c
    WHERE c.id = support_messages.chat_id
      AND c.email IS NOT NULL AND lower(c.email) = lower(auth.jwt() ->> 'email')
  ));

-- notifications: owner by user_email
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_email IS NOT NULL AND lower(user_email) = lower(auth.jwt() ->> 'email'));

-- profiles INSERT: the signup trigger (handle_new_user, SECURITY DEFINER) bypasses RLS, so clients
-- only ever need to insert their own non-privileged row.
DROP POLICY IF EXISTS "Allow trigger insert" ON public.profiles;
CREATE POLICY "Users insert own profile (no roles)" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND coalesce(is_admin, false) = false AND coalesce(is_ambassador, false) = false);

-- profiles UPDATE: "Users can update own profile" allowed a user to set is_admin/is_ambassador on
-- their own row. Role flags can now only be changed by admins, the service role, or SQL/migrations.
CREATE OR REPLACE FUNCTION public.profiles_guard_role_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
    NEW.is_ambassador := OLD.is_ambassador;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_guard_role_flags ON public.profiles;
CREATE TRIGGER profiles_guard_role_flags
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_role_flags();
