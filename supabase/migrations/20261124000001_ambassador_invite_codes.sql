-- Ambassador invite codes: 5 word-based codes Josias hands to ambassadors.
-- A person enters a code on the join form (or follows ?invite=CODE); the code is
-- validated against this table BEFORE the sign-up is accepted, and recorded on
-- the waitlist_signups row + the Brevo contact so Josias can see which
-- ambassador drove which sign-up. Codes are invite-only, NOT discounts, and
-- NOT the VBN-XXXX-XXXX verify codes (different table, different format).
-- Multi-use: one code per ambassador slot, shared with as many people as that
-- ambassador reaches. Revoke by setting status = 'revoked'.
-- Requires 20261023000005_waitlist_signups.sql (applied to production Oct 23, 2026).
-- Idempotent: safe to re-run. NOT yet applied to production: review, then apply.

CREATE TABLE IF NOT EXISTS public.ambassador_invite_codes (
  code          TEXT PRIMARY KEY CHECK (code ~ '^[A-Z]{4,24}$'),
  slot          TEXT NOT NULL,                       -- 'Ambassador 1' .. 'Ambassador 5'
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  ambassador_id UUID,                                -- ambassadors.id once Josias assigns the slot
  uses          INTEGER NOT NULL DEFAULT 0 CHECK (uses >= 0),
  last_used_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,                        -- NULL = no expiry
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Server-only: RLS on with NO policies, and no grants to anon/authenticated.
-- Reads/writes happen through /api/waitlist and /api/waitlist/validate-invite with the service role.
ALTER TABLE public.ambassador_invite_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ambassador_invite_codes FROM anon, authenticated;

-- The 5 launch codes (word-based, easy to say out loud and type).
INSERT INTO public.ambassador_invite_codes (code, slot) VALUES
  ('NOVA',   'Ambassador 1'),
  ('COMET',  'Ambassador 2'),
  ('ORBIT',  'Ambassador 3'),
  ('ZENITH', 'Ambassador 4'),
  ('LUMEN',  'Ambassador 5')
ON CONFLICT (code) DO NOTHING;

-- Record which invite code drove each sign-up (NULL = joined without a code).
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS ambassador_code TEXT REFERENCES public.ambassador_invite_codes(code);
CREATE INDEX IF NOT EXISTS waitlist_signups_ambassador_code_idx
  ON public.waitlist_signups (ambassador_code) WHERE ambassador_code IS NOT NULL;

-- Per-code report: sign-ups per invite code (service role only, like the campaign view).
-- security_invoker so the view obeys waitlist_signups RLS (no policies = service role only).
CREATE OR REPLACE VIEW public.waitlist_signups_by_invite_code
WITH (security_invoker = true) AS
SELECT
  c.code AS invite_code,
  c.slot,
  c.status,
  c.uses,
  (SELECT COUNT(*) FROM public.waitlist_signups w WHERE w.ambassador_code = c.code) AS signups,
  c.last_used_at
FROM public.ambassador_invite_codes c
ORDER BY signups DESC, c.code;
REVOKE ALL ON public.waitlist_signups_by_invite_code FROM anon, authenticated;
