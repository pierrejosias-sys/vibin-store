-- Drop 01 campaign tracking: store first-touch UTM on waitlist sign-ups.
-- Requires 20261023000005_waitlist_signups.sql (applied to production Oct 23, 2026).
-- Idempotent: safe to re-run. NOT yet applied to production: review, then apply.
-- First-touch rule: utm_* columns are set on insert and only filled when NULL on re-signup;
-- the composite source tag is appended to sources[] on every campaign sign-up.
-- Validation mirrors app/api/waitlist/route.js SOURCE_RE = /^[a-z0-9-]{1,40}$/.

ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS utm_source   TEXT CHECK (utm_source   IS NULL OR utm_source   ~ '^[a-z0-9-]{1,40}$'),
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT CHECK (utm_campaign IS NULL OR utm_campaign ~ '^[a-z0-9-]{1,40}$'),
  ADD COLUMN IF NOT EXISTS utm_medium   TEXT CHECK (utm_medium   IS NULL OR utm_medium   ~ '^[a-z0-9-]{1,40}$');

-- Weekly report: sign-ups per campaign.
CREATE INDEX IF NOT EXISTS waitlist_signups_campaign_idx
  ON public.waitlist_signups (utm_campaign) WHERE utm_campaign IS NOT NULL;

-- security_invoker so the view obeys waitlist_signups RLS (no policies = service role only).
-- Without it, the view would run as its owner and expose counts to anon via the API.
CREATE OR REPLACE VIEW public.waitlist_signups_by_campaign
WITH (security_invoker = true) AS
SELECT
  COALESCE(utm_source, '(direct)')   AS utm_source,
  COALESCE(utm_campaign, '(none)')   AS utm_campaign,
  COUNT(*)                            AS signups,
  MIN(created_at)                     AS first_seen,
  MAX(created_at)                     AS last_seen
FROM public.waitlist_signups
GROUP BY utm_source, utm_campaign
ORDER BY signups DESC, utm_source, utm_campaign;

REVOKE ALL ON public.waitlist_signups_by_campaign FROM anon, authenticated;

-- Composite source tags (d01-waitlist-<utm_source>-<utm_campaign>) live in the existing
-- sources TEXT[] column; the application code appends them. No RLS change.
