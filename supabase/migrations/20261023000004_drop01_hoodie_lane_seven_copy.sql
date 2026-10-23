-- Drop 01 VOL 01 Hoodie (hd) is now print-on-demand through Printful on a
-- Lane Seven LS17001 blank: DTF print, no cords. Copy must not claim garment-dye or cords.
-- Price stays $195.
ALTER TABLE public.drop_styles ADD COLUMN IF NOT EXISTS description TEXT;

UPDATE public.drop_styles
   SET description = 'Lane Seven heavyweight pullover hoodie (LS17001): 16.5 oz cotton/poly fleece, relaxed fit, raglan sleeves, kangaroo pocket and ribbed cuffs and hem. Double-layer hood with no cords. Front artwork is DTF printed. Printed to order.',
       care_info   = 'Machine wash cold inside out, hang dry, do not bleach, and do not iron the print.',
       price       = 195
 WHERE drop_id = 'd01' AND style_code = 'hd';

UPDATE public.drops
   SET story = 'Drop 01 is the first numbered Vibin Apparel run, limited to 50 pieces per style, designed in Jacksonville, FL.'
 WHERE id = 'd01';
