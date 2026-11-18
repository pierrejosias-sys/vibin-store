-- Two lanyards as two products (Josias, Nov 18 2026).
-- The original lanyard row (slug 'lanyard', id 14) becomes the Wordmark design; Star is a new row with
-- the same price, category, stock and tags. Images, descriptions and specs live in app/lib/product-extras.mjs.
-- NOT yet applied to production. Apply right after PR #84 merges (the Star page 404s until it is).
UPDATE public.products
   SET name = 'Vibin Lanyard — Wordmark'
 WHERE slug = 'lanyard';

INSERT INTO public.products (name, slug, price, category, in_stock, stock_qty, tags, is_featured)
SELECT 'Vibin Lanyard — Star', 'lanyard-star', price, category, in_stock, stock_qty, tags, is_featured
  FROM public.products
 WHERE slug = 'lanyard'
   AND NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'lanyard-star');
