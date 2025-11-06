-- Create segments table
CREATE TABLE public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create responsaveis table
CREATE TABLE public.responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  regime TEXT NOT NULL CHECK (regime IN ('simples', 'lucro_real', 'lucro_presumido', 'produtor_rural')),
  segment_id UUID REFERENCES public.segments(id) ON DELETE SET NULL,
  sem_movimento BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create fiscal_data table (Simples Nacional)
CREATE TABLE public.fiscal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,
  receita_bruta DECIMAL(15,2),
  deducoes DECIMAL(15,2),
  base_calculo DECIMAL(15,2),
  aliquota DECIMAL(5,2),
  valor_devido DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, period)
);

-- Create lucro_real_data table
CREATE TABLE public.lucro_real_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  responsavel_id UUID REFERENCES public.responsaveis(id) ON DELETE SET NULL,
  period TEXT NOT NULL,
  receita_bruta DECIMAL(15,2),
  custos DECIMAL(15,2),
  despesas DECIMAL(15,2),
  lucro_liquido DECIMAL(15,2),
  irpj DECIMAL(15,2),
  csll DECIMAL(15,2),
  pis DECIMAL(15,2),
  cofins DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, period)
);

-- Create lucro_presumido_data table
CREATE TABLE public.lucro_presumido_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,
  receita_bruta DECIMAL(15,2),
  base_calculo DECIMAL(15,2),
  irpj DECIMAL(15,2),
  csll DECIMAL(15,2),
  pis DECIMAL(15,2),
  cofins DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, period)
);

-- Create produtor_rural_data table
CREATE TABLE public.produtor_rural_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,
  receita_bruta DECIMAL(15,2),
  despesas DECIMAL(15,2),
  resultado DECIMAL(15,2),
  funrural DECIMAL(15,2),
  senar DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, period)
);

-- Create company_passwords table
CREATE TABLE public.company_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cnpj_regimes table
CREATE TABLE public.cnpj_regimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT NOT NULL UNIQUE,
  regime TEXT NOT NULL CHECK (regime IN ('simples', 'lucro_real', 'lucro_presumido', 'produtor_rural')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX idx_companies_regime ON public.companies(regime);
CREATE INDEX idx_companies_segment ON public.companies(segment_id);
CREATE INDEX idx_fiscal_data_company ON public.fiscal_data(company_id);
CREATE INDEX idx_fiscal_data_period ON public.fiscal_data(period);
CREATE INDEX idx_lucro_real_company ON public.lucro_real_data(company_id);
CREATE INDEX idx_lucro_real_period ON public.lucro_real_data(period);
CREATE INDEX idx_lucro_presumido_company ON public.lucro_presumido_data(company_id);
CREATE INDEX idx_lucro_presumido_period ON public.lucro_presumido_data(period);
CREATE INDEX idx_produtor_rural_company ON public.produtor_rural_data(company_id);
CREATE INDEX idx_produtor_rural_period ON public.produtor_rural_data(period);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fiscal_data_updated_at
  BEFORE UPDATE ON public.fiscal_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lucro_real_data_updated_at
  BEFORE UPDATE ON public.lucro_real_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lucro_presumido_data_updated_at
  BEFORE UPDATE ON public.lucro_presumido_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtor_rural_data_updated_at
  BEFORE UPDATE ON public.produtor_rural_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_passwords_updated_at
  BEFORE UPDATE ON public.company_passwords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Disable RLS for all tables (internal system without user authentication)
ALTER TABLE public.segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsaveis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucro_real_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucro_presumido_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtor_rural_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_passwords DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnpj_regimes DISABLE ROW LEVEL SECURITY;