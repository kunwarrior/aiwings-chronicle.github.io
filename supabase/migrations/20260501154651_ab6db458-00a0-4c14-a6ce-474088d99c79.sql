-- Add payment tracking columns to registrations
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS fee_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS transaction_ref text,
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Seed branding settings row if not present
INSERT INTO public.site_settings (key, value)
VALUES ('branding', '{"hero_logo_url": null, "dark_bg_color": null, "dark_bg_color_2": null, "color_effects_enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Ensure hero settings row exists
INSERT INTO public.site_settings (key, value)
VALUES ('hero', '{"effects_enabled": true, "background_image_url": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;
