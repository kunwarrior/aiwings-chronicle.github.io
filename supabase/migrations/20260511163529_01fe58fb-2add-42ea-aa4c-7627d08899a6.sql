
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS user_id uuid;

DROP POLICY IF EXISTS "Public can register" ON public.registrations;

CREATE POLICY "Authenticated users can register themselves"
ON public.registrations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND lower(email) = lower(coalesce(auth.jwt()->>'email',''))
  AND length(full_name) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 200
  AND length(phone) BETWEEN 5 AND 30
  AND (branch IS NULL OR length(branch) <= 80)
  AND (year IS NULL OR length(year) <= 20)
  AND (message IS NULL OR length(message) <= 1000)
);

CREATE POLICY "Users can view their own registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_user_unique
ON public.registrations(event_id, user_id)
WHERE user_id IS NOT NULL AND event_id IS NOT NULL;
