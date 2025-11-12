-- Adicionar colunas servicos e difal na tabela fiscal_data
ALTER TABLE public.fiscal_data 
ADD COLUMN IF NOT EXISTS servicos numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS difal numeric DEFAULT 0;