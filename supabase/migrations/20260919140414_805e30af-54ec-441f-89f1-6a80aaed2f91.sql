CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  event_title text NOT NULL,
  achievement_type text NOT NULL DEFAULT 'Participation',
  issued_on date NOT NULL DEFAULT CURRENT_DATE,
  issued_by text NOT NULL DEFAULT 'The AI Wings, Gyan Ganga College of Technology',
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.certificates TO service_role;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to certificates"
ON public.certificates FOR SELECT TO authenticated USING (false);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.verify_certificate(p_certificate_id text)
RETURNS TABLE (
  certificate_id text,
  full_name text,
  event_title text,
  achievement_type text,
  issued_on date,
  issued_by text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.certificate_id, c.full_name, c.event_title, c.achievement_type, c.issued_on, c.issued_by
  FROM public.certificates c
  WHERE upper(trim(c.certificate_id)) = upper(trim(p_certificate_id))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;