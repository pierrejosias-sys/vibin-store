-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- SEED, NOT APPLIED (Nov 20, 2026). Product's draft picks from /workspace/product/pod/pod-specs-pdp-nov20.md.
-- Needs Josias's yes. Requires 20261120200000_pod_unnumbered_products.sql first.
-- Both rows are UNPUBLISHED drafts (published = false): hidden from /shop, /shop/made-to-order, search and
-- the sitemap by RLS and by the code. GRAPHIC: TBD (no approved graphic; never a Drop 01 design).
-- Images: none yet (image_url NULL, images []), so pages show the "Vibin Apparel / <name>" placeholder tile.
-- printful_variants: NULL until the Printful store exists (the admin draft button refuses unmapped items).
-- Pricing (Finance §8, Nov 20): tee S–2XL $48; hoodie S–XL $72, 2XL $75. 3XL–5XL are not sold (POD_SIZES = S–2XL).
-- Shipping (Finance §8): customer-paid, first item + add-on per product. Stored rates are Printful's base US
-- standard rates; the code adds the $0.40 holiday surcharge once per order through Jan 17, 2027 ET
-- (POD_HOLIDAY_SURCHARGE), giving Finance's numbers: tee $5.35 first / $2.20 add-on, hoodie $9.19 / $2.50.
-- Never covered by free shipping at $125+ (that rule stays for non-made-to-order items).
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

INSERT INTO public.products
  (name, slug, price, category, color, description, in_stock, images, image_url, tags,
   fulfillment, numbered, published, size_prices, ship_days, ships_separately, ship_first_rate, ship_addon_rate, printful_variants)
VALUES
  ('Vibin Core Tee', 'vibin-core-tee', 48.00, 'tops', 'Black',
   'A soft midweight cotton tee with a retail, slightly tailored fit. Each one is printed after you order, in Black, on a Bella+Canvas 3001.',
   true, '[]'::jsonb, NULL, ARRAY['made-to-order'],
   'printful_pod', false, false, NULL, NULL, false, 4.95, 2.20, NULL),
  ('Vibin Core Hoodie', 'vibin-core-hoodie', 72.00, 'tops', 'Black',
   'A classic midweight fleece hoodie for everyday wear. Each one is printed after you order, in Black, on a Gildan 18500.',
   true, '[]'::jsonb, NULL, ARRAY['made-to-order'],
   'printful_pod', false, false, '{"2XL": 75}'::jsonb, NULL, false, 8.79, 2.50, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Internal specs (not stored): Tee = Printful catalog product 71, Bella+Canvas 3001, DTG default front, Black, S–2XL.
-- Hoodie = Printful catalog product 146, Gildan 18500, DTG default front, Black, S–2XL. Print placement/size OPEN.
