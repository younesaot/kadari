
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Students profile
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  student_code text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  level text,
  wilaya text,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student reads own profile" ON public.students FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin reads all students" ON public.students FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Join requests
CREATE TYPE public.join_request_status AS ENUM ('pending','accepted','rejected');
CREATE TABLE public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  level text NOT NULL,
  wilaya text NOT NULL,
  message text,
  status join_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);
GRANT INSERT ON public.join_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.join_requests TO authenticated;
GRANT ALL ON public.join_requests TO service_role;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit join request" ON public.join_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins manage join requests" ON public.join_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update join requests" ON public.join_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete join requests" ON public.join_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Site settings (single row)
CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1,
  platform_name text NOT NULL DEFAULT 'منصة الأستاذ قاداري',
  teacher_name text NOT NULL DEFAULT 'الأستاذ قاداري',
  teacher_bio text NOT NULL DEFAULT 'أستاذ رياضيات للتعليم الثانوي مع خبرة تدريس متميزة.',
  contact_email text,
  contact_phone text,
  facebook_url text,
  youtube_url text,
  join_requests_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Audit logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
