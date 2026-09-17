-- Seed default maintenance mode setting
INSERT INTO public.site_settings (key, value)
VALUES ('maintenance', '{"enabled": false, "message": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;