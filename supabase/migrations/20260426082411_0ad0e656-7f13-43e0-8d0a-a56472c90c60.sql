
DROP POLICY "Public can register" ON public.registrations;
CREATE POLICY "Public can register" ON public.registrations FOR INSERT
WITH CHECK (
  length(full_name) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 200
  AND length(phone) BETWEEN 5 AND 30
  AND (branch IS NULL OR length(branch) <= 80)
  AND (year IS NULL OR length(year) <= 20)
  AND (message IS NULL OR length(message) <= 1000)
);
