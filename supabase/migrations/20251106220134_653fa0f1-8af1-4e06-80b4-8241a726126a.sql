-- Fix fiscal_data table schema to match application code
ALTER TABLE public.fiscal_data 
  DROP COLUMN IF EXISTS receita_bruta,
  DROP COLUMN IF EXISTS deducoes,
  DROP COLUMN IF EXISTS base_calculo,
  DROP COLUMN IF EXISTS aliquota,
  DROP COLUMN IF EXISTS valor_devido;

ALTER TABLE public.fiscal_data
  ADD COLUMN rbt12 NUMERIC DEFAULT 0 NOT NULL,
  ADD COLUMN entrada NUMERIC DEFAULT 0 NOT NULL,
  ADD COLUMN saida NUMERIC DEFAULT 0 NOT NULL,
  ADD COLUMN imposto NUMERIC DEFAULT 0 NOT NULL;