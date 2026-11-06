-- Drop 01 launch moved: pre-order opens Thu Nov 19, 2026 7:00 PM ET, closes Sun Nov 22, 2026 11:59 PM ET.
-- (Waitlist early hour 6:00-7:00 PM ET Nov 19 lives in app/lib/drops.js earlyAccessAt.)
UPDATE public.drops
   SET release_at = '2026-11-20T00:00:00Z', closes_at = '2026-11-23T04:59:59Z'
 WHERE id = 'd01';
