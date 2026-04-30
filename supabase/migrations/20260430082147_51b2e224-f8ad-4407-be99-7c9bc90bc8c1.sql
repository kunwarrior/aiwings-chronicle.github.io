
-- site_settings: single-row key/value table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- seed default hero settings row
INSERT INTO public.site_settings (key, value)
VALUES ('hero', '{"effects_enabled": true, "background_image_url": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- events: add is_live flag
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_live boolean NOT NULL DEFAULT false;
