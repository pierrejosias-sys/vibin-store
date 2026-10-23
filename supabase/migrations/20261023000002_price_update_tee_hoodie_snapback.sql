-- Approved prices (Oct 23, 2026): Foundation Tee $85 (all sizes S–3X; prices are
-- per product, there are no per-size price columns), VOL 01 Hoodie $195, Snapback $65.
UPDATE public.products SET price = 85.00 WHERE id = 1 AND slug = 'vibin-classic-tee';
UPDATE public.products SET price = 65.00 WHERE id = 10 AND slug = 'vibin-snapback';
UPDATE public.drop_styles SET price = 195.00 WHERE drop_id = 'd01' AND style_code = 'hd';
