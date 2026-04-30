-- Enum für Rollen
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum für Swipe-Aktionen
CREATE TYPE public.swipe_action AS ENUM ('like', 'dislike', 'save');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Wardrobe Items
CREATE TABLE public.wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT,
  colors TEXT[] DEFAULT '{}',
  style_tags TEXT[] DEFAULT '{}',
  description TEXT,
  season TEXT,
  analyzed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_wardrobe_user ON public.wardrobe_items(user_id);

CREATE POLICY "Users view own wardrobe"
  ON public.wardrobe_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wardrobe"
  ON public.wardrobe_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own wardrobe"
  ON public.wardrobe_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own wardrobe"
  ON public.wardrobe_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Style Profiles
CREATE TABLE public.style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  aesthetic_labels TEXT[] DEFAULT '{}',
  color_palette TEXT[] DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own style profile"
  ON public.style_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own style profile"
  ON public.style_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own style profile"
  ON public.style_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Product Swipes
CREATE TABLE public.product_swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  product_data JSONB NOT NULL,
  action swipe_action NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE public.product_swipes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_swipes_user_action ON public.product_swipes(user_id, action);

CREATE POLICY "Users view own swipes"
  ON public.product_swipes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own swipes"
  ON public.product_swipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own swipes"
  ON public.product_swipes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own swipes"
  ON public.product_swipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Product Cache (shared)
CREATE TABLE public.product_cache (
  query_hash TEXT PRIMARY KEY,
  query_text TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_cache ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cache_created ON public.product_cache(created_at);

CREATE POLICY "Cache readable by authenticated"
  ON public.product_cache FOR SELECT TO authenticated USING (true);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_style_profiles_updated_at BEFORE UPDATE ON public.style_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for wardrobe images (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('wardrobe', 'wardrobe', false);

CREATE POLICY "Users view own wardrobe images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own wardrobe images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own wardrobe images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);