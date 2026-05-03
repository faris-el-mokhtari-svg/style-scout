ALTER TABLE public.style_profiles
  ADD COLUMN IF NOT EXISTS dna_preferences jsonb;
