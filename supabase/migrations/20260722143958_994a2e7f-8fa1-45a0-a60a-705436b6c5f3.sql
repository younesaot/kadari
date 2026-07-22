ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS student_app_url text,
  ADD COLUMN IF NOT EXISTS admin_app_url text;

INSERT INTO public.site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;