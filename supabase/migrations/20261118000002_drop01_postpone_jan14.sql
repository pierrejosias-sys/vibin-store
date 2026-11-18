-- Drop 01 postponed: pre-order opens Thu Jan 14, 2027 7:00 PM ET and closes Sun Jan 17, 2027 11:59 PM ET
-- (end time still to be confirmed). Replaces the Nov 19 window set in 20261104000001_drop01_move_to_nov19.sql.
-- The waitlist early hour (6:00-7:00 PM ET Jan 14) lives in app/lib/drop-public.mjs earlyAccessAt.
-- Apply together with the code change: /drop/01 and /api/checkout read these two columns.
UPDATE public.drops
   SET release_at = '2027-01-15T00:00:00Z', closes_at = '2027-01-18T04:59:59Z'
 WHERE id = 'd01';
