-- Copy legacy vibin_signups into waitlist_signups (runs right after 20261023000005).
-- One row per lower(trim(email)) (earliest sign-up wins), fresh early-access token,
-- original created_at kept, source tagged 'legacy'. Existing waitlist emails are left as-is
-- (only 'legacy' is appended to their sources). Idempotent: safe to re-run.
-- Token: 64 hex chars from two UUIDv4s (no pgcrypto needed; matches the CHECK regex).
WITH legacy AS (
  SELECT DISTINCT ON (lower(trim(email)))
         lower(trim(email)) AS email, created_at
  FROM public.vibin_signups
  WHERE email IS NOT NULL AND trim(email) <> '' AND position('@' IN email) > 1
  ORDER BY lower(trim(email)), created_at ASC NULLS LAST
)
INSERT INTO public.waitlist_signups (email, sources, consent_email, consent_at, early_access_token, created_at, updated_at)
SELECT l.email, ARRAY['legacy'], true, coalesce(l.created_at, now()),
       replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
       coalesce(l.created_at, now()), now()
FROM legacy l
ON CONFLICT ((lower(email))) DO UPDATE
  SET sources = CASE WHEN 'legacy' = ANY (public.waitlist_signups.sources) THEN public.waitlist_signups.sources
                     ELSE public.waitlist_signups.sources || ARRAY['legacy'] END;
