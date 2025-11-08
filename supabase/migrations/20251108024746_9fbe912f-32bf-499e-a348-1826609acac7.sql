-- Permitir valores NULL para cnpj e regime_tributario
-- Empresas do Simples Nacional podem não ter CNPJ ou regime definido imediatamente

ALTER TABLE public.companies 
ALTER COLUMN cnpj DROP NOT NULL;

ALTER TABLE public.companies 
ALTER COLUMN regime_tributario DROP NOT NULL;