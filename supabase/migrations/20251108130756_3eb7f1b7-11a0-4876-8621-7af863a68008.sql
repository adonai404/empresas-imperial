-- Habilitar RLS em todas as tabelas públicas e criar políticas de acesso público
-- Tabela: companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a companies"
ON public.companies FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela: company_passwords
ALTER TABLE public.company_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a company_passwords"
ON public.company_passwords FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela: fiscal_data
ALTER TABLE public.fiscal_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a fiscal_data"
ON public.fiscal_data FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela: lucro_presumido_data
ALTER TABLE public.lucro_presumido_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a lucro_presumido_data"
ON public.lucro_presumido_data FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela: lucro_real_data
ALTER TABLE public.lucro_real_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a lucro_real_data"
ON public.lucro_real_data FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela: produtor_rural_data
ALTER TABLE public.produtor_rural_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a produtor_rural_data"
ON public.produtor_rural_data FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela: responsaveis
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a responsaveis"
ON public.responsaveis FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela: segments
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a segments"
ON public.segments FOR ALL
USING (true)
WITH CHECK (true);