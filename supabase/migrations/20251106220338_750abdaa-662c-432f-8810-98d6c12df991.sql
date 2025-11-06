-- Fix lucro_real_data table schema to match application code
ALTER TABLE public.lucro_real_data
  DROP COLUMN IF EXISTS receita_bruta,
  DROP COLUMN IF EXISTS custos,
  DROP COLUMN IF EXISTS despesas,
  DROP COLUMN IF EXISTS lucro_liquido,
  DROP COLUMN IF EXISTS irpj,
  DROP COLUMN IF EXISTS csll;

ALTER TABLE public.lucro_real_data
  ADD COLUMN IF NOT EXISTS entradas NUMERIC,
  ADD COLUMN IF NOT EXISTS saidas NUMERIC,
  ADD COLUMN IF NOT EXISTS servicos NUMERIC,
  ADD COLUMN IF NOT EXISTS icms NUMERIC,
  ADD COLUMN IF NOT EXISTS irpj_primeiro_trimestre NUMERIC,
  ADD COLUMN IF NOT EXISTS csll_primeiro_trimestre NUMERIC,
  ADD COLUMN IF NOT EXISTS irpj_segundo_trimestre NUMERIC,
  ADD COLUMN IF NOT EXISTS csll_segundo_trimestre NUMERIC,
  ADD COLUMN IF NOT EXISTS tvi NUMERIC;