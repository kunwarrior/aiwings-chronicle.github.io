
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS payment_qr_url text,
  ADD COLUMN IF NOT EXISTS required_fields jsonb NOT NULL DEFAULT '{"full_name":true,"email":true,"phone":true,"branch":false,"year":false,"message":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_questions jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS custom_responses jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Update RLS check on registrations to allow new optional fields (the existing policy already permits insert)
DROP POLICY IF EXISTS "Public can register" ON public.registrations;
CREATE POLICY "Public can register"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (
  length(full_name) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 200
  AND length(phone) BETWEEN 5 AND 30
  AND (branch IS NULL OR length(branch) <= 80)
  AND (year IS NULL OR length(year) <= 20)
  AND (message IS NULL OR length(message) <= 1000)
);
