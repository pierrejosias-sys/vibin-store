-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- SEPARATE DB STEP: needs its own yes from Josias. NOT applied. Do not run it as part of the code deploy.
--
-- Drop 01 = Foundation Tee (te) + Snapback (sb) only, 50 numbered pieces per style (Josias, Nov 20 9:36 AM ET).
-- The VOL 01 Hoodie (hd) is pulled until samples arrive (Josias, Nov 20 9:38 AM ET).
--
-- What it does (idempotent; safe to re-run):
--   1. pieces.status gains 'reserved' (numbered samples/gifts, never sold) and 'retired' (refunded after marking).
--      pieces gains `marked` (NULL = unknown, TRUE = number already printed/marked, FALSE = confirmed not marked).
--      drop_styles gains `reserved_count` (the reserve parameter, 0 for now).
--   2. drop_styles rows: d01/te 'Foundation Tee' $85.00, d01/sb 'Snapback' $65.00 (approved prices, Oct 23).
--   3. pieces: numbers 1–50 for te and for sb (100 rows), each with a random unique 4-char code. Existing rows are
--      never touched; only missing numbers are inserted. UNIQUE (drop_id, style_code, number) and
--      CHECK (number BETWEEN 1 AND 50) stay, so no style can ever have more than 50 or a duplicate number.
--   4. Hoodie: d01/hd pieces that are 'available'/'held' -> 'withheld' (unsellable even if code changed).
--   5. drops.story -> no count (shown on tag pages /t/...; /drop/01 uses the code's story). Retires "50 pieces per style".
--   6. Functions: refund_pieces() (refund rule), set_piece_marked(), set_style_reserve() (reserve, 0 per style),
--      mark_pieces_sold() replaced so it never touches retired/reserved/withheld pieces.
--   7. Trigger pieces_guard: a sold or retired number can never go back on sale, except a refunded number that
--      was explicitly confirmed NOT marked (marked = FALSE), which Legal allows to go to the next paid order.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- 1. Statuses + columns ---------------------------------------------------------------------------
ALTER TABLE public.pieces DROP CONSTRAINT IF EXISTS pieces_status_check;
ALTER TABLE public.pieces ADD CONSTRAINT pieces_status_check
  CHECK (status IN ('available', 'held', 'sold', 'withheld', 'reserved', 'retired'));
ALTER TABLE public.pieces ADD COLUMN IF NOT EXISTS marked BOOLEAN;           -- NULL = unknown (treated as marked)
ALTER TABLE public.pieces ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ;
ALTER TABLE public.drop_styles ADD COLUMN IF NOT EXISTS reserved_count INTEGER NOT NULL DEFAULT 0
  CHECK (reserved_count BETWEEN 0 AND 50);

-- 2. Styles ---------------------------------------------------------------------------------------
INSERT INTO public.drop_styles (drop_id, style_code, name, price, care_info, sort_order) VALUES
  ('d01', 'te', 'Foundation Tee', 85.00, 'Machine wash cold inside out, hang dry, do not bleach, and do not iron the print.', 0),
  ('d01', 'sb', 'Snapback',       65.00, 'Spot clean only. Do not machine wash or tumble dry.', 5)
ON CONFLICT (drop_id, style_code) DO NOTHING;

-- 3. Seed 50 numbered pieces per style (codes: 4 chars from a-z0-9, from gen_random_uuid() bytes) --------
DO $$
DECLARE
  st TEXT; n INT; c TEXT; b BYTEA; i INT; ok INT;
  alphabet CONSTANT TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
BEGIN
  FOREACH st IN ARRAY ARRAY['te', 'sb'] LOOP
    FOR n IN 1..50 LOOP
      CONTINUE WHEN EXISTS (SELECT 1 FROM public.pieces WHERE drop_id = 'd01' AND style_code = st AND number = n);
      LOOP
        b := uuid_send(gen_random_uuid());
        c := '';
        FOR i IN 0..3 LOOP c := c || substr(alphabet, (get_byte(b, i) % 36) + 1, 1); END LOOP;
        INSERT INTO public.pieces (drop_id, style_code, number, code, status)
        VALUES ('d01', st, n, c, 'available')
        ON CONFLICT DO NOTHING;
        GET DIAGNOSTICS ok = ROW_COUNT;
        EXIT WHEN ok = 1;  -- retry only on a code collision
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- 4. Hoodie off sale ------------------------------------------------------------------------------
UPDATE public.pieces
   SET status = 'withheld', held_until = NULL, size = NULL, stripe_session_id = NULL, order_id = NULL, updated_at = NOW()
 WHERE drop_id = 'd01' AND style_code = 'hd' AND status IN ('available', 'held');

-- 5. Story (tag pages; no count, the cap is described only by Legal's numbered claim) --------------------------------------------------------
UPDATE public.drops
   SET story = 'Drop 01 is the first numbered Vibin Apparel run, designed in Jacksonville, FL.'
 WHERE id = 'd01';

-- 6. Functions ------------------------------------------------------------------------------------
-- Same as before, but never sells a piece that is retired, reserved or withheld.
CREATE OR REPLACE FUNCTION public.mark_pieces_sold(p_piece_ids UUID[], p_order_id TEXT, p_session_id TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE pieces
     SET status = 'sold', held_until = NULL, sold_at = NOW(),
         order_id = p_order_id, stripe_session_id = p_session_id, updated_at = NOW()
   WHERE id = ANY(p_piece_ids)
     AND ((status = 'held' AND stripe_session_id = p_session_id) OR status = 'available');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Refund rule (Legal, Nov 20): a sold number explicitly confirmed NOT marked (marked = FALSE) goes back to
-- 'available' for the next paid order; every other sold number (marked = TRUE or unknown) is 'retired' for good.
CREATE OR REPLACE FUNCTION public.refund_pieces(p_piece_ids UUID[], p_session_id TEXT DEFAULT NULL)
RETURNS TABLE (retired INTEGER, reassigned INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r INTEGER; a INTEGER;
BEGIN
  UPDATE pieces SET status = 'retired', retired_at = NOW(), updated_at = NOW()
   WHERE id = ANY(p_piece_ids) AND status = 'sold' AND marked IS DISTINCT FROM FALSE
     AND (p_session_id IS NULL OR stripe_session_id = p_session_id);
  GET DIAGNOSTICS r = ROW_COUNT;
  UPDATE pieces SET status = 'available', size = NULL, sold_at = NULL, order_id = NULL,
                    stripe_session_id = NULL, held_until = NULL, marked = NULL, updated_at = NOW()
   WHERE id = ANY(p_piece_ids) AND status = 'sold' AND marked IS FALSE
     AND (p_session_id IS NULL OR stripe_session_id = p_session_id);
  GET DIAGNOSTICS a = ROW_COUNT;
  RETURN QUERY SELECT r, a;
END $$;

-- Logistics records whether a number has been printed/marked (TRUE) or confirmed not yet marked (FALSE).
CREATE OR REPLACE FUNCTION public.set_piece_marked(p_piece_ids UUID[], p_marked BOOLEAN)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE pieces SET marked = p_marked, updated_at = NOW() WHERE id = ANY(p_piece_ids);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Reserve for numbered samples/gifts: the HIGHEST p_count numbers of the style that are not sold, held, retired
-- or withheld become 'reserved' (never claimable, not in "left" counts, still part of the 50). Lowering the count
-- puts the lowest reserved numbers back to 'available'. Fails if not enough numbers are free.
CREATE OR REPLACE FUNCTION public.set_style_reserve(p_drop_id TEXT, p_style_code TEXT, p_count INTEGER)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ids UUID[]; n INTEGER;
BEGIN
  IF p_count IS NULL OR p_count < 0 OR p_count > 50 THEN RAISE EXCEPTION 'reserve must be 0-50'; END IF;
  PERFORM release_expired_piece_holds();
  SELECT ARRAY(SELECT id FROM pieces
                WHERE drop_id = p_drop_id AND style_code = p_style_code AND status IN ('available', 'reserved')
                ORDER BY number DESC LIMIT p_count FOR UPDATE) INTO v_ids;
  IF COALESCE(array_length(v_ids, 1), 0) < p_count THEN RAISE EXCEPTION 'only % numbers free to reserve', COALESCE(array_length(v_ids, 1), 0); END IF;
  UPDATE pieces SET status = 'available', updated_at = NOW()
   WHERE drop_id = p_drop_id AND style_code = p_style_code AND status = 'reserved' AND NOT (id = ANY(v_ids));
  UPDATE pieces SET status = 'reserved', updated_at = NOW() WHERE id = ANY(v_ids) AND status = 'available';
  UPDATE drop_styles SET reserved_count = p_count WHERE drop_id = p_drop_id AND style_code = p_style_code;
  SELECT COUNT(*) INTO n FROM pieces WHERE drop_id = p_drop_id AND style_code = p_style_code AND status = 'reserved';
  RETURN n;
END $$;

-- 7. Guard: sold/retired numbers never go back on sale (except the explicit not-marked refund case) -------
CREATE OR REPLACE FUNCTION public.pieces_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.drop_id <> OLD.drop_id OR NEW.style_code <> OLD.style_code OR NEW.number <> OLD.number OR NEW.code <> OLD.code THEN
    RAISE EXCEPTION 'piece identity (drop, style, number, code) is permanent';
  END IF;
  IF OLD.status = 'retired' AND NEW.status <> 'retired' THEN
    RAISE EXCEPTION 'piece %-%-% is retired and can never be sold again', OLD.drop_id, OLD.style_code, OLD.number;
  END IF;
  IF OLD.status = 'sold' AND NEW.status NOT IN ('sold', 'retired')
     AND NOT (NEW.status = 'available' AND OLD.marked IS FALSE) THEN
    RAISE EXCEPTION 'piece %-%-% is sold; a refund retires it unless it was confirmed not marked', OLD.drop_id, OLD.style_code, OLD.number;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pieces_guard ON public.pieces;
CREATE TRIGGER pieces_guard BEFORE UPDATE ON public.pieces FOR EACH ROW EXECUTE FUNCTION public.pieces_guard();

-- Privileges: mutating functions only for service_role.
REVOKE ALL ON FUNCTION public.mark_pieces_sold(UUID[], TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_pieces(UUID[], TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_piece_marked(UUID[], BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_style_reserve(TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_pieces_sold(UUID[], TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_pieces(UUID[], TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_piece_marked(UUID[], BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_style_reserve(TEXT, TEXT, INTEGER) TO service_role;

-- Reserve parameter: 0 per style until Josias answers. To change later (needs his yes), one line, e.g.:
--   SELECT public.set_style_reserve('d01', 'te', 3);
SELECT public.set_style_reserve('d01', 'te', 0);
SELECT public.set_style_reserve('d01', 'sb', 0);
