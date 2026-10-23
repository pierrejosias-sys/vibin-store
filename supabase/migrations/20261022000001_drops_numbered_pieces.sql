-- ═══════════════════════════════════════════════════════════════════
-- Drops + numbered inventory (pieces) + atomic claim/hold functions
--
-- Tables:   drops, drop_styles, drop_style_sizes, pieces
-- Functions (all SECURITY DEFINER, search_path pinned):
--   release_expired_piece_holds()                 -> int
--   claim_pieces(drop, style, size, qty, minutes)  -> setof pieces  (service_role only)
--   mark_pieces_sold(ids, order_id, session_id)    -> int           (service_role only)
--   release_pieces(ids, session_id)                -> int           (service_role only)
--   drop_inventory(drop)                           -> per style/size counts (public)
--   piece_by_tag(drop, style, number, code)        -> one piece's public data (public)
--
-- RLS: pieces has NO anon/authenticated policies, so the public can never
-- list codes. Public reads go through drop_inventory()/piece_by_tag() only.
-- NOT yet applied to production — review then run via `supabase db push`.
-- ═══════════════════════════════════════════════════════════════════

-- 1. DROPS ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drops (
  id          TEXT PRIMARY KEY CHECK (id ~ '^d[0-9]{2}$'),   -- e.g. 'd01'
  slug        TEXT UNIQUE NOT NULL,                          -- e.g. '01' -> /drop/01
  name        TEXT NOT NULL,
  story       TEXT,
  release_at  TIMESTAMPTZ,            -- NULL = not announced yet (page stays locked)
  pieces_per_style INTEGER NOT NULL DEFAULT 50 CHECK (pieces_per_style BETWEEN 1 AND 999),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read drops" ON public.drops;
CREATE POLICY "Public can read drops" ON public.drops FOR SELECT USING (true);

-- PLACEHOLDER: release_at intentionally NULL until the real release time is set.
-- Set it with: UPDATE drops SET release_at = '2026-MM-DDTHH:MM:00-04:00' WHERE id = 'd01';
INSERT INTO public.drops (id, slug, name, story, release_at)
VALUES ('d01', '01', 'Drop 01: The Foundation',
        'PLACEHOLDER — Drop 01 story copy goes here.', NULL)
ON CONFLICT (id) DO NOTHING;

-- 2. STYLES PER DROP -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drop_styles (
  drop_id     TEXT NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
  style_code  TEXT NOT NULL CHECK (style_code ~ '^[a-z]{2,4}$'),
  name        TEXT NOT NULL,
  price       DECIMAL(10,2),          -- authoritative price used by /api/checkout
  care_info   TEXT,
  sort_order  INTEGER DEFAULT 0,
  PRIMARY KEY (drop_id, style_code)
);
ALTER TABLE public.drop_styles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read drop styles" ON public.drop_styles;
CREATE POLICY "Public can read drop styles" ON public.drop_styles FOR SELECT USING (true);

-- PLACEHOLDER prices/care copy — confirm before release.
INSERT INTO public.drop_styles (drop_id, style_code, name, price, care_info, sort_order) VALUES
  ('d01', 'hd',  'Hoodie',         NULL, 'PLACEHOLDER care info', 1),
  ('d01', 'cj',  'Cargo Jogger',   NULL, 'PLACEHOLDER care info', 2),
  ('d01', 'wb',  'Windbreaker',    NULL, 'PLACEHOLDER care info', 3),
  ('d01', 'ns',  'Nylon Shorts',   NULL, 'PLACEHOLDER care info', 4)
ON CONFLICT DO NOTHING;

-- 3. OPTIONAL SIZE ALLOCATIONS ---------------------------------------------
-- Pieces are numbered per style; size is assigned at sale. If a row exists
-- here, claim_pieces() caps how many pieces of that style can go to that size.
CREATE TABLE IF NOT EXISTS public.drop_style_sizes (
  drop_id     TEXT NOT NULL,
  style_code  TEXT NOT NULL,
  size        TEXT NOT NULL,
  allocation  INTEGER NOT NULL CHECK (allocation >= 0),
  PRIMARY KEY (drop_id, style_code, size),
  FOREIGN KEY (drop_id, style_code) REFERENCES public.drop_styles(drop_id, style_code) ON DELETE CASCADE
);
ALTER TABLE public.drop_style_sizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read drop sizes" ON public.drop_style_sizes;
CREATE POLICY "Public can read drop sizes" ON public.drop_style_sizes FOR SELECT USING (true);

-- 4. PIECES ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pieces (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id            TEXT NOT NULL,
  style_code         TEXT NOT NULL,
  number             INTEGER NOT NULL CHECK (number BETWEEN 1 AND 50),
  code               TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9]{4}$'),
  size               TEXT,                         -- assigned when claimed
  status             TEXT NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available', 'held', 'sold')),
  held_until         TIMESTAMPTZ,
  order_id           TEXT,                         -- orders.id (type-agnostic)
  stripe_session_id  TEXT,
  sold_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (drop_id, style_code, number),
  FOREIGN KEY (drop_id, style_code) REFERENCES public.drop_styles(drop_id, style_code),
  CHECK (status <> 'held' OR held_until IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_pieces_claim   ON public.pieces(drop_id, style_code, status, number);
CREATE INDEX IF NOT EXISTS idx_pieces_held    ON public.pieces(held_until) WHERE status = 'held';
CREATE INDEX IF NOT EXISTS idx_pieces_session ON public.pieces(stripe_session_id);

ALTER TABLE public.pieces ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies for anon/authenticated: codes are never listable.
REVOKE ALL ON public.pieces FROM anon, authenticated;

-- 5. FUNCTIONS -------------------------------------------------------------

-- Releases holds whose time has passed. Called on every read/claim.
CREATE OR REPLACE FUNCTION public.release_expired_piece_holds()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE pieces
     SET status = 'available', held_until = NULL, size = NULL,
         stripe_session_id = NULL, order_id = NULL, updated_at = NOW()
   WHERE status = 'held' AND held_until < NOW();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Atomically claims p_qty available pieces (lowest numbers first) and holds them.
-- Returns the claimed rows, or zero rows if not enough are available (all-or-nothing).
CREATE OR REPLACE FUNCTION public.claim_pieces(
  p_drop_id TEXT, p_style_code TEXT, p_size TEXT, p_qty INTEGER,
  p_hold_minutes INTEGER DEFAULT 10
) RETURNS SETOF public.pieces
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ids   UUID[];
  v_alloc INTEGER;
  v_used  INTEGER;
BEGIN
  IF p_qty IS NULL OR p_qty < 1 OR p_qty > 10 THEN
    RAISE EXCEPTION 'invalid quantity';
  END IF;

  PERFORM release_expired_piece_holds();

  -- Optional per-size cap. Lock the allocation row so concurrent claims for
  -- the same style/size serialize on the cap check.
  SELECT allocation INTO v_alloc FROM drop_style_sizes
   WHERE drop_id = p_drop_id AND style_code = p_style_code AND size = p_size
   FOR UPDATE;
  IF FOUND THEN
    SELECT COUNT(*) INTO v_used FROM pieces
     WHERE drop_id = p_drop_id AND style_code = p_style_code AND size = p_size
       AND status IN ('held', 'sold');
    IF v_used + p_qty > v_alloc THEN
      RETURN;
    END IF;
  END IF;

  SELECT ARRAY(
    SELECT id FROM pieces
     WHERE drop_id = p_drop_id AND style_code = p_style_code AND status = 'available'
     ORDER BY number
     LIMIT p_qty
     FOR UPDATE SKIP LOCKED
  ) INTO v_ids;

  IF COALESCE(array_length(v_ids, 1), 0) < p_qty THEN
    RETURN;  -- not enough; row locks released at end of txn, nothing changed
  END IF;

  RETURN QUERY
  UPDATE pieces
     SET status = 'held', size = p_size,
         held_until = NOW() + make_interval(mins => p_hold_minutes),
         updated_at = NOW()
   WHERE id = ANY(v_ids)
  RETURNING *;
END $$;

-- Attach session id to held pieces (called right after the Stripe session is created).
CREATE OR REPLACE FUNCTION public.attach_piece_session(p_piece_ids UUID[], p_session_id TEXT, p_order_id TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE pieces SET stripe_session_id = p_session_id, order_id = p_order_id, updated_at = NOW()
   WHERE id = ANY(p_piece_ids) AND status = 'held';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Marks pieces sold. Accepts pieces still held by this session, or whose hold
-- lapsed and were released but nobody else has claimed since (status available).
CREATE OR REPLACE FUNCTION public.mark_pieces_sold(p_piece_ids UUID[], p_order_id TEXT, p_session_id TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE pieces
     SET status = 'sold', held_until = NULL, sold_at = NOW(),
         order_id = p_order_id, stripe_session_id = p_session_id, updated_at = NOW()
   WHERE id = ANY(p_piece_ids)
     AND (stripe_session_id = p_session_id OR status = 'available')
     AND status <> 'sold';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Releases held pieces for a session (checkout.session.expired / failed checkout).
CREATE OR REPLACE FUNCTION public.release_pieces(p_piece_ids UUID[], p_session_id TEXT DEFAULT NULL)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE pieces
     SET status = 'available', held_until = NULL, size = NULL,
         stripe_session_id = NULL, order_id = NULL, updated_at = NOW()
   WHERE id = ANY(p_piece_ids) AND status = 'held'
     AND (p_session_id IS NULL OR stripe_session_id IS NULL OR stripe_session_id = p_session_id);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Public: counts only. Rows with size = NULL are style-level totals.
CREATE OR REPLACE FUNCTION public.drop_inventory(p_drop_id TEXT)
RETURNS TABLE (style_code TEXT, size TEXT, total INTEGER, remaining INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM release_expired_piece_holds();
  RETURN QUERY
    SELECT p.style_code, NULL::TEXT, COUNT(*)::INT,
           COUNT(*) FILTER (WHERE p.status = 'available')::INT
      FROM pieces p WHERE p.drop_id = p_drop_id GROUP BY p.style_code
  UNION ALL
    SELECT a.style_code, a.size, a.allocation,
           LEAST(
             GREATEST(a.allocation - (SELECT COUNT(*) FROM pieces p
                WHERE p.drop_id = a.drop_id AND p.style_code = a.style_code
                  AND p.size = a.size AND p.status IN ('held','sold')), 0),
             (SELECT COUNT(*) FROM pieces p WHERE p.drop_id = a.drop_id
                AND p.style_code = a.style_code AND p.status = 'available')
           )::INT
      FROM drop_style_sizes a WHERE a.drop_id = p_drop_id;
END $$;

-- Public: tag page lookup. Requires the full tag (incl. secret code) to match.
CREATE OR REPLACE FUNCTION public.piece_by_tag(p_drop_id TEXT, p_style_code TEXT, p_number INTEGER, p_code TEXT)
RETURNS TABLE (drop_id TEXT, drop_name TEXT, drop_story TEXT, style_code TEXT, style_name TEXT,
               care_info TEXT, number INTEGER, total INTEGER, size TEXT, status TEXT, sold_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM release_expired_piece_holds();
  RETURN QUERY
  SELECT p.drop_id, d.name, d.story, p.style_code, s.name, s.care_info, p.number,
         d.pieces_per_style, CASE WHEN p.status = 'sold' THEN p.size END, p.status, p.sold_at
    FROM pieces p
    JOIN drops d ON d.id = p.drop_id
    JOIN drop_styles s ON s.drop_id = p.drop_id AND s.style_code = p.style_code
   WHERE p.code = lower(p_code) AND p.drop_id = p_drop_id
     AND p.style_code = p_style_code AND p.number = p_number;
END $$;

-- Privileges: mutating functions only for service_role.
REVOKE ALL ON FUNCTION public.release_expired_piece_holds() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_pieces(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attach_piece_session(UUID[], TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_pieces_sold(UUID[], TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_pieces(UUID[], TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_piece_holds() TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_pieces(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.attach_piece_session(UUID[], TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_pieces_sold(UUID[], TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_pieces(UUID[], TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.drop_inventory(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.piece_by_tag(TEXT, TEXT, INTEGER, TEXT) TO anon, authenticated, service_role;
