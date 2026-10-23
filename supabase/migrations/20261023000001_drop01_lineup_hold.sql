-- Drop 01 approved launch lineup (Oct 22, 2026): only the VOL 01 Hoodie (hd) is for sale.
-- Cargo Jogger (cj) and Windbreaker (wb) are "coming soon"; Nylon Shorts (ns) are dropped.
-- Pieces for those styles move to a new 'withheld' status, so claim_pieces() (which only
-- takes status = 'available') can never hold or sell them. Tag pages still verify them.
ALTER TABLE public.pieces DROP CONSTRAINT IF EXISTS pieces_status_check;
ALTER TABLE public.pieces ADD CONSTRAINT pieces_status_check
  CHECK (status IN ('available', 'held', 'sold', 'withheld'));

UPDATE public.pieces
   SET status = 'withheld', held_until = NULL, size = NULL, updated_at = NOW()
 WHERE drop_id = 'd01' AND style_code IN ('cj', 'wb', 'ns') AND status IN ('available', 'held');

-- Approved product names.
UPDATE public.drop_styles SET name = 'VOL 01 Hoodie' WHERE drop_id = 'd01' AND style_code = 'hd';
UPDATE public.products SET name = 'Foundation Tee' WHERE id = 1 AND slug = 'vibin-classic-tee';
UPDATE public.products SET name = 'Snapback' WHERE id = 10 AND slug = 'vibin-snapback';
