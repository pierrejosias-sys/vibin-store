-- ═══════════════════════════════════════════════════════════════════
-- Vibin Verify: hang-tag authenticity + loyalty points
--
-- Tables (server-only: RLS on, NO policies, no grants to anon/authenticated):
--   verify_reward_tiers  reward costs; the server never trusts a cost sent by the browser
--   verify_codes         one row per physical piece, registered BEFORE its tag is printed
--   points_accounts      one row per email holding points; balance moves with the ledger
--   redemptions          one row per reward issued (reward_code is single-use, tied to the account)
--   points_ledger        history of earn / bonus / redeem / expire; never just a balance
--
-- Functions (SECURITY DEFINER, search_path pinned, service_role ONLY). They are called by
-- /api/verify/[code], /api/claim and /api/redeem with the service role, never from the browser:
--   verify_scan(code)             scan counter + public piece data
--   verify_claim(code, email)     atomic first-claim + points award (one transaction)
--   verify_redeem(email, tier)    atomic points spend + single-use reward code (one transaction)
--
-- Why claim / redeem are atomic:
--   claim   UPDATE verify_codes SET claimed = true WHERE code = $1 AND claimed = false.
--           A second, simultaneous claim waits on the row lock, re-checks claimed = false, finds
--           zero rows and gets 'already_claimed'. A unique index (one 'earn' per code) is the backstop.
--   redeem  locks the points_accounts row first, so concurrent redeems for one account run one at a
--           time and each sees the committed balance. Points are spent oldest-lot-first.
--
-- Rules: points_value 100 standard / 150 limited, +50 on an account's first-ever claim, points
-- expire 12 months after they are earned (lots; expiry is applied lazily inside claim / redeem).
-- Column note: the handoff's `drop` column is named drop_name here (DROP is a reserved word);
-- the API still returns it as "drop".
-- ═══════════════════════════════════════════════════════════════════

-- 1. REWARD TIERS ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verify_reward_tiers (
  tier_id         TEXT PRIMARY KEY CHECK (tier_id ~ '^[A-Z0-9]{4,12}$'),
  points_cost     INTEGER NOT NULL CHECK (points_cost > 0),
  label           TEXT NOT NULL,
  discount_cents  INTEGER NOT NULL CHECK (discount_cents > 0),
  early_access    BOOLEAN NOT NULL DEFAULT false,      -- next-drop early access rides along with this tier
  active          BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO public.verify_reward_tiers (tier_id, points_cost, label, discount_cents, early_access) VALUES
  ('VIBIN10', 200, '$10 off', 1000, false),
  ('VIBIN25', 400, '$25 off', 2500, false),
  ('VIBIN50', 750, '$50 off + early access to the next drop', 5000, true)
ON CONFLICT (tier_id) DO NOTHING;

-- 2. CODES: one row per physical piece -------------------------------------
CREATE TABLE IF NOT EXISTS public.verify_codes (
  code          TEXT PRIMARY KEY CHECK (code ~ '^VBN-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  product       TEXT NOT NULL,
  drop_name     TEXT NOT NULL,                          -- API field "drop"
  colorway      TEXT,
  size          TEXT,
  points_value  INTEGER NOT NULL CHECK (points_value > 0),   -- 100 standard, 150 limited colorways
  claimed       BOOLEAN NOT NULL DEFAULT false,
  claimed_at    TIMESTAMPTZ,
  claimed_by    TEXT CHECK (claimed_by IS NULL OR claimed_by = lower(claimed_by)),   -- account email
  scan_count    INTEGER NOT NULL DEFAULT 0 CHECK (scan_count >= 0),
  last_scan_at  TIMESTAMPTZ,
  batch_id      TEXT,                                   -- production batch sent to the tag printer ('demo' = demo codes)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT verify_codes_claim_consistent CHECK (
    (claimed AND claimed_at IS NOT NULL AND claimed_by IS NOT NULL)
    OR (NOT claimed AND claimed_at IS NULL AND claimed_by IS NULL))
);
CREATE INDEX IF NOT EXISTS verify_codes_batch_idx ON public.verify_codes (batch_id);

-- 3. POINTS ACCOUNTS: keyed by lower-cased email ---------------------------
CREATE TABLE IF NOT EXISTS public.points_accounts (
  email           TEXT PRIMARY KEY CHECK (
                    email = lower(email) AND length(email) <= 254
                    AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  balance         INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  first_claim_at  TIMESTAMPTZ,                          -- set when the +50 first-verify bonus is paid
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. REDEMPTIONS ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.redemptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_email  TEXT NOT NULL REFERENCES public.points_accounts(email),
  tier_id        TEXT NOT NULL REFERENCES public.verify_reward_tiers(tier_id),
  points_spent   INTEGER NOT NULL CHECK (points_spent > 0),
  reward_code    TEXT NOT NULL UNIQUE,                  -- single-use; tied to account_email
  used_at        TIMESTAMPTZ,                           -- set by checkout when the code is consumed
  used_order_id  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS redemptions_account_idx ON public.redemptions (account_email, created_at);

-- 5. LEDGER -------------------------------------------------------------------
-- points is signed: earn / bonus > 0, redeem / expire < 0. Earn and bonus rows are "lots": remaining
-- is how much of the lot is still unspent (the only column that is ever updated), expires_at is
-- earned + 12 months. Invariant: points_accounts.balance = SUM(points) = SUM(remaining of lots).
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_email  TEXT NOT NULL REFERENCES public.points_accounts(email),
  kind           TEXT NOT NULL CHECK (kind IN ('earn', 'bonus', 'redeem', 'expire')),
  points         INTEGER NOT NULL,
  remaining      INTEGER,
  expires_at     TIMESTAMPTZ,
  code           TEXT REFERENCES public.verify_codes(code),
  redemption_id  UUID REFERENCES public.redemptions(id),
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT points_ledger_shape CHECK (
    (kind IN ('earn', 'bonus') AND points > 0 AND remaining BETWEEN 0 AND points AND expires_at IS NOT NULL)
    OR (kind IN ('redeem', 'expire') AND points < 0 AND remaining IS NULL AND expires_at IS NULL))
);
-- Structural guarantee that points move exactly once per code, whatever the application does.
CREATE UNIQUE INDEX IF NOT EXISTS points_ledger_one_earn_per_code ON public.points_ledger (code) WHERE kind = 'earn';
CREATE INDEX IF NOT EXISTS points_ledger_account_idx ON public.points_ledger (account_email, created_at);
CREATE INDEX IF NOT EXISTS points_ledger_open_lots_idx ON public.points_ledger (account_email, expires_at, id) WHERE remaining > 0;

-- 6. FUNCTIONS ------------------------------------------------------------------

-- 10-char reward code from an unambiguous alphabet (no 0 O 1 I L), drawn from gen_random_uuid().
CREATE OR REPLACE FUNCTION public.verify_random_code(p_len INTEGER DEFAULT 10)
RETURNS TEXT
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_alpha CONSTANT TEXT := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';              -- 31 characters
  v_pick  CONSTANT INTEGER[] := ARRAY[0,1,2,3,4,5,7,9,10,11,12,13,14,15];  -- skips the fixed version/variant bytes of a v4 uuid
  v_bytes BYTEA := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  v_out   TEXT := '';
BEGIN
  IF p_len < 1 OR p_len > 14 THEN RAISE EXCEPTION 'invalid length'; END IF;
  FOR i IN 1..p_len LOOP
    v_out := v_out || substr(v_alpha, 1 + (get_byte(v_bytes, v_pick[i]) % 31), 1);
  END LOOP;
  RETURN v_out;
END $$;

-- Retire lots whose 12 months are up: zero the lot, write an 'expire' ledger row, lower the balance.
-- Internal: claim / redeem call it while already holding the points_accounts row lock.
CREATE OR REPLACE FUNCTION public.verify_expire_lots(p_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_lot   RECORD;
  v_total INTEGER := 0;
BEGIN
  FOR v_lot IN
    SELECT l.id, l.code, l.remaining
      FROM public.points_ledger l
     WHERE l.account_email = p_email AND l.kind IN ('earn', 'bonus')
       AND l.remaining > 0 AND l.expires_at <= now()
     ORDER BY l.expires_at, l.id
       FOR UPDATE
  LOOP
    UPDATE public.points_ledger SET remaining = 0 WHERE id = v_lot.id;
    INSERT INTO public.points_ledger (account_email, kind, points, code, note)
    VALUES (p_email, 'expire', -v_lot.remaining, v_lot.code, 'expired 12 months after earning');
    v_total := v_total + v_lot.remaining;
  END LOOP;
  IF v_total > 0 THEN
    UPDATE public.points_accounts SET balance = balance - v_total, updated_at = now() WHERE email = p_email;
  END IF;
  RETURN v_total;
END $$;

-- Public piece data for one code; bumps scan_count / last_scan_at. Zero rows = not registered.
-- Never creates a code and never returns claimed_by.
CREATE OR REPLACE FUNCTION public.verify_scan(p_code TEXT)
RETURNS TABLE (code TEXT, product TEXT, drop_name TEXT, colorway TEXT, size TEXT,
               points_value INTEGER, claimed BOOLEAN, claimed_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN QUERY
  UPDATE public.verify_codes AS v
     SET scan_count = v.scan_count + 1, last_scan_at = now()
   WHERE v.code = upper(btrim(p_code))
  RETURNING v.code, v.product, v.drop_name, v.colorway, v.size, v.points_value, v.claimed, v.claimed_at;
END $$;

-- Atomic first claim. Outcomes: 'claimed' | 'already_claimed' | 'not_found'.
CREATE OR REPLACE FUNCTION public.verify_claim(p_code TEXT, p_account TEXT)
RETURNS TABLE (o_outcome TEXT, o_points_awarded INTEGER, o_bonus INTEGER, o_new_balance INTEGER, o_claimed_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_code  TEXT := upper(btrim(p_code));
  v_email TEXT := lower(btrim(p_account));
  v_now   TIMESTAMPTZ := now();
  v_pts   INTEGER;
  v_bonus INTEGER := 0;
  v_first TIMESTAMPTZ;
  v_bal   INTEGER;
  v_prev  TIMESTAMPTZ;
BEGIN
  IF v_email IS NULL OR length(v_email) > 254
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'invalid account' USING ERRCODE = '22023';
  END IF;

  -- THE ATOMIC GATE. Only one transaction can flip claimed false -> true. A simultaneous claim blocks
  -- on this row, re-checks claimed = false once the winner commits, matches nothing and falls through.
  UPDATE public.verify_codes AS v
     SET claimed = true, claimed_at = v_now, claimed_by = v_email
   WHERE v.code = v_code AND v.claimed = false
  RETURNING v.points_value INTO v_pts;

  IF NOT FOUND THEN
    SELECT v.claimed_at INTO v_prev FROM public.verify_codes v WHERE v.code = v_code;
    IF NOT FOUND THEN
      RETURN QUERY SELECT 'not_found'::TEXT, 0, 0, NULL::INTEGER, NULL::TIMESTAMPTZ;
    ELSE
      RETURN QUERY SELECT 'already_claimed'::TEXT, 0, 0, NULL::INTEGER, v_prev;
    END IF;
    RETURN;
  END IF;

  -- Create the account if new, then lock its row: the +50 bonus and the balance update serialise per account.
  INSERT INTO public.points_accounts (email) VALUES (v_email) ON CONFLICT (email) DO NOTHING;
  SELECT a.first_claim_at INTO v_first FROM public.points_accounts a WHERE a.email = v_email FOR UPDATE;

  PERFORM public.verify_expire_lots(v_email);
  IF v_first IS NULL THEN v_bonus := 50; END IF;

  INSERT INTO public.points_ledger (account_email, kind, points, remaining, expires_at, code, note)
  VALUES (v_email, 'earn', v_pts, v_pts, v_now + interval '12 months', v_code, 'claimed piece');
  IF v_bonus > 0 THEN
    INSERT INTO public.points_ledger (account_email, kind, points, remaining, expires_at, code, note)
    VALUES (v_email, 'bonus', v_bonus, v_bonus, v_now + interval '12 months', v_code, 'first-ever verify bonus');
  END IF;

  UPDATE public.points_accounts AS a
     SET balance = a.balance + v_pts + v_bonus,
         first_claim_at = COALESCE(a.first_claim_at, v_now),
         updated_at = v_now
   WHERE a.email = v_email
  RETURNING a.balance INTO v_bal;

  RETURN QUERY SELECT 'claimed'::TEXT, v_pts + v_bonus, v_bonus, v_bal, v_now;
END $$;

-- Atomic redeem. Outcomes: 'redeemed' | 'insufficient_points' | 'invalid_tier'.
CREATE OR REPLACE FUNCTION public.verify_redeem(p_account TEXT, p_tier_id TEXT)
RETURNS TABLE (o_outcome TEXT, o_reward_code TEXT, o_points_spent INTEGER, o_new_balance INTEGER,
               o_points_needed INTEGER, o_tier_label TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_email   TEXT := lower(btrim(p_account));
  v_tier    public.verify_reward_tiers%ROWTYPE;
  v_bal     INTEGER;
  v_need    INTEGER;
  v_lot     RECORD;
  v_take    INTEGER;
  v_rid     UUID := gen_random_uuid();
  v_reward  TEXT;
  v_attempt INTEGER := 0;
BEGIN
  IF v_email IS NULL OR length(v_email) > 254
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'invalid account' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_tier FROM public.verify_reward_tiers t WHERE t.tier_id = upper(btrim(p_tier_id)) AND t.active;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid_tier'::TEXT, NULL::TEXT, 0, NULL::INTEGER, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;

  -- Lock the account first: concurrent redeems for one account run one at a time and each sees the
  -- committed balance, so two taps on a 200-point balance can only ever buy one $10 reward.
  SELECT a.balance INTO v_bal FROM public.points_accounts a WHERE a.email = v_email FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'insufficient_points'::TEXT, NULL::TEXT, 0, 0, v_tier.points_cost, v_tier.label;
    RETURN;
  END IF;

  PERFORM public.verify_expire_lots(v_email);
  SELECT a.balance INTO v_bal FROM public.points_accounts a WHERE a.email = v_email;

  IF v_bal < v_tier.points_cost THEN
    RETURN QUERY SELECT 'insufficient_points'::TEXT, NULL::TEXT, 0, v_bal, v_tier.points_cost, v_tier.label;
    RETURN;
  END IF;

  -- Spend the oldest lots first (they expire first).
  v_need := v_tier.points_cost;
  FOR v_lot IN
    SELECT l.id, l.remaining FROM public.points_ledger l
     WHERE l.account_email = v_email AND l.kind IN ('earn', 'bonus') AND l.remaining > 0
     ORDER BY l.expires_at, l.id
       FOR UPDATE
  LOOP
    EXIT WHEN v_need = 0;
    v_take := LEAST(v_lot.remaining, v_need);
    UPDATE public.points_ledger SET remaining = remaining - v_take WHERE id = v_lot.id;
    v_need := v_need - v_take;
  END LOOP;
  IF v_need > 0 THEN
    RAISE EXCEPTION 'points ledger out of step with balance for %', v_email USING ERRCODE = 'XX001';  -- rolls everything back
  END IF;

  -- Single-use reward code, e.g. VIBIN10-7K3QX9M2PD
  LOOP
    v_reward := v_tier.tier_id || '-' || public.verify_random_code(10);
    BEGIN
      INSERT INTO public.redemptions (id, account_email, tier_id, points_spent, reward_code)
      VALUES (v_rid, v_email, v_tier.tier_id, v_tier.points_cost, v_reward);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_attempt := v_attempt + 1;
      IF v_attempt >= 5 THEN RAISE; END IF;
    END;
  END LOOP;

  INSERT INTO public.points_ledger (account_email, kind, points, redemption_id, note)
  VALUES (v_email, 'redeem', -v_tier.points_cost, v_rid, v_tier.tier_id);

  UPDATE public.points_accounts AS a
     SET balance = a.balance - v_tier.points_cost, updated_at = now()
   WHERE a.email = v_email
  RETURNING a.balance INTO v_bal;

  RETURN QUERY SELECT 'redeemed'::TEXT, v_reward, v_tier.points_cost, v_bal, 0, v_tier.label;
END $$;

-- 7. LOCKDOWN -------------------------------------------------------------------
-- RLS on with NO policies and no grants to anon / authenticated: the browser (anon key) can neither
-- read nor write any of this. Everything goes through the three functions, called with the service role.
ALTER TABLE public.verify_reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verify_codes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger       ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.verify_reward_tiers, public.verify_codes, public.points_accounts,
              public.redemptions, public.points_ledger FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.points_ledger_id_seq FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.verify_reward_tiers, public.verify_codes, public.points_accounts,
             public.redemptions, public.points_ledger TO service_role;
GRANT ALL ON SEQUENCE public.points_ledger_id_seq TO service_role;

REVOKE ALL ON FUNCTION public.verify_random_code(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_expire_lots(TEXT)    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_scan(TEXT)           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_claim(TEXT, TEXT)    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_redeem(TEXT, TEXT)   FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_random_code(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_expire_lots(TEXT)    TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_scan(TEXT)           TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_claim(TEXT, TEXT)    TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_redeem(TEXT, TEXT)   TO service_role;

-- 8. DEMO SEED (batch 'demo'): the four registered demo codes ------------------------
-- VBN-FAKE-0000 is deliberately NOT registered: it must come back 'not_found'.
-- The 2601 suffix on every demo code = 2026 drop 01 (SS26).
-- VBN-MDV9-2601 is pre-claimed by the placeholder 'demo-seed' (no ledger row, no real account).
INSERT INTO public.verify_codes (code, product, drop_name, colorway, size, points_value, batch_id) VALUES
  ('VBN-TCH5-2601', 'Tech Shorts',                  'Drop 01 SS26', 'Black / Gasoline Turquoise',        'L',  150, 'demo'),
  ('VBN-HDE8-2601', 'Heavyweight Oversized Hoodie', 'Drop 01 SS26', 'Black',                             'XL', 100, 'demo'),
  ('VBN-BRF3-2601', 'Long-Leg Boxer Briefs',        'Drop 01 SS26', 'Black / Turquoise waistband',       'M',  100, 'demo')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.verify_codes (code, product, drop_name, colorway, size, points_value, batch_id, claimed, claimed_at, claimed_by) VALUES
  ('VBN-MDV9-2601', 'Move Different Tee', 'Drop 01 SS26', 'Deep Green', 'L', 100, 'demo', true, '2026-11-12 12:00:00-05', 'demo-seed')
ON CONFLICT (code) DO NOTHING;
