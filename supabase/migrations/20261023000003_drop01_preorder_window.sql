-- Drop 01 numbered pre-order window: opens Thu Nov 12, 2026 7:00 PM ET, closes Sun Nov 15, 2026 11:59 PM ET.
ALTER TABLE public.drops ADD COLUMN IF NOT EXISTS closes_at TIMESTAMPTZ;
UPDATE public.drops
   SET release_at = '2026-11-13T00:00:00Z', closes_at = '2026-11-16T04:59:59Z'
 WHERE id = 'd01';
