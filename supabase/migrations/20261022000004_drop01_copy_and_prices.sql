-- Drop 01: approved story/care copy and style prices (replaces placeholders).
UPDATE public.drops SET story = 'Drop 01 is the first numbered Vibin Apparel run, limited to 50 pieces per style, made in Jacksonville, FL.' WHERE id = 'd01';
UPDATE public.drop_styles SET care_info = 'Machine wash cold inside out, hang dry, do not bleach, and iron low away from prints and embroidery.' WHERE drop_id = 'd01';
UPDATE public.drop_styles SET price = CASE style_code
  WHEN 'hd' THEN 98 WHEN 'cj' THEN 88 WHEN 'wb' THEN 128 WHEN 'ns' THEN 58 END
 WHERE drop_id = 'd01' AND style_code IN ('hd', 'cj', 'wb', 'ns');
