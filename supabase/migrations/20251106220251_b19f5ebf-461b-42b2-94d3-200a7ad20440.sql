-- Fix column name mismatches for regime_tributario
-- Rename 'regime' to 'regime_tributario' in cnpj_regimes table
ALTER TABLE public.cnpj_regimes 
  RENAME COLUMN regime TO regime_tributario;

-- Rename 'regime' to 'regime_tributario' in companies table
ALTER TABLE public.companies 
  RENAME COLUMN regime TO regime_tributario;

-- Fix segment_id to segmento in companies table (code uses 'segmento' as text, not a foreign key)
ALTER TABLE public.companies
  DROP COLUMN IF EXISTS segment_id,
  ADD COLUMN IF NOT EXISTS segmento TEXT;

-- Add responsavel_id to companies table if it doesn't exist (used by lucro_real companies)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES public.responsaveis(id);