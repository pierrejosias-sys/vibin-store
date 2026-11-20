-- Careers: anonymous applicants may only create applications in the 'pending' state.
-- Replaces the old allow-everything insert policy. Admin read/update policies are unchanged.
ALTER TABLE public.job_applications ALTER COLUMN status SET DEFAULT 'pending';

DROP POLICY IF EXISTS "Anyone can apply for jobs" ON public.job_applications;
CREATE POLICY "Anyone can apply for jobs"
  ON public.job_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status IS NULL OR status = 'pending');
