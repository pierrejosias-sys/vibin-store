-- Waitlist sign-ups + private early-access tokens (tool-agnostic; ESP sync columns).
-- NOT yet applied to production — review, then apply.
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT NOT NULL,
  first_name         TEXT,
  sources            TEXT[] NOT NULL DEFAULT '{}',   -- e.g. {'d01-waitlist','homepage-newsletter'}
  styles             TEXT[] NOT NULL DEFAULT '{}',   -- e.g. {'cj','wb'} for coming-soon interest
  consent_email      BOOLEAN NOT NULL DEFAULT false,
  consent_at         TIMESTAMPTZ,
  early_access_token TEXT NOT NULL UNIQUE CHECK (early_access_token ~ '^[A-Za-z0-9_-]{20,64}$'),
  token_used_at      TIMESTAMPTZ,                     -- set by the Stripe webhook; token = one early checkout
  token_used_session_id TEXT,                         -- Stripe Checkout Session that used it
  synced_to          TEXT,                            -- e.g. 'brevo'
  synced_at          TIMESTAMPTZ,                     -- set only on a successful ESP sync
  sync_error         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_email_key ON public.waitlist_signups (lower(email));
CREATE INDEX IF NOT EXISTS waitlist_signups_unsynced_idx ON public.waitlist_signups (created_at) WHERE synced_at IS NULL;

-- Server-only: RLS on with NO policies, and no grants to anon/authenticated.
-- Reads/writes happen through /api/waitlist and /api/checkout with the service role.
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.waitlist_signups FROM anon, authenticated;
