
-- update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name TEXT, last_name TEXT, email TEXT, phone TEXT,
  linkedin TEXT, github TEXT, portfolio TEXT,
  current_title TEXT, years_experience INTEGER DEFAULT 0,
  location TEXT, remote_preference TEXT DEFAULT 'flexible',
  target_salary_min INTEGER, target_salary_max INTEGER, currency TEXT DEFAULT 'EUR',
  target_contracts JSONB DEFAULT '[]'::jsonb,
  target_sectors JSONB DEFAULT '[]'::jsonb,
  hard_skills JSONB DEFAULT '[]'::jsonb,
  soft_skills JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  bio TEXT, pitch_30s TEXT, pitch_2min TEXT,
  search_status TEXT DEFAULT 'active',
  available_from DATE,
  profile_completion INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, company TEXT NOT NULL,
  company_logo TEXT, company_size TEXT, company_website TEXT,
  sector TEXT, contract_type TEXT, location TEXT, remote TEXT,
  salary_min INTEGER, salary_max INTEGER, salary_currency TEXT DEFAULT 'EUR',
  source_url TEXT, description TEXT,
  required_skills JSONB DEFAULT '[]'::jsonb,
  nice_to_have_skills JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'to_apply',
  applied_at TIMESTAMPTZ,
  cv_used UUID,
  cover_letter TEXT,
  ai_score JSONB,
  personal_note TEXT, personal_rating INTEGER,
  priority TEXT DEFAULT 'medium',
  tags JSONB DEFAULT '[]'::jsonb,
  contacts JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  interviews JSONB DEFAULT '[]'::jsonb,
  follow_ups JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  archived_at TIMESTAMPTZ, archive_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_select_own" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "applications_insert_own" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "applications_update_own" ON public.applications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "applications_delete_own" ON public.applications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_applications_user_status ON public.applications(user_id, status);

-- CVS
CREATE TABLE public.cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, version TEXT DEFAULT '1.0',
  pdf_url TEXT, pdf_base64 TEXT,
  target_title TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  average_ats_score INTEGER DEFAULT 0,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cvs TO authenticated;
GRANT ALL ON public.cvs TO service_role;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cvs_select_own" ON public.cvs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cvs_insert_own" ON public.cvs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cvs_update_own" ON public.cvs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cvs_delete_own" ON public.cvs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_cvs_updated BEFORE UPDATE ON public.cvs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- AI GENERATIONS
CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES public.cvs(id) ON DELETE CASCADE,
  input JSONB, output TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generations TO authenticated;
GRANT ALL ON public.ai_generations TO service_role;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_select_own" ON public.ai_generations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_insert_own" ON public.ai_generations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_update_own" ON public.ai_generations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_delete_own" ON public.ai_generations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SETTINGS
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  mammouth_api_key TEXT,
  theme TEXT DEFAULT 'dark',
  color_theme TEXT DEFAULT 'violet',
  density TEXT DEFAULT 'normal',
  notifications_enabled BOOLEAN DEFAULT true,
  sla_watchlist INTEGER DEFAULT 3,
  sla_applied INTEGER DEFAULT 7,
  sla_interview INTEGER DEFAULT 2,
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_own" ON public.settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "settings_insert_own" ON public.settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update_own" ON public.settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "settings_delete_own" ON public.settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile + settings on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name', ''));
  INSERT INTO public.settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for CV PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false) ON CONFLICT DO NOTHING;

CREATE POLICY "cvs_storage_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "cvs_storage_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "cvs_storage_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "cvs_storage_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
