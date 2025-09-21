-- Criar tabela para regimes de CNPJ independente de empresas cadastradas
CREATE TABLE public.cnpj_regimes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj TEXT NOT NULL UNIQUE,
  regime_tributario regime_tributario_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_cnpj_regimes_cnpj ON public.cnpj_regimes(cnpj);
CREATE INDEX idx_cnpj_regimes_regime ON public.cnpj_regimes(regime_tributario);

-- Habilitar RLS
ALTER TABLE public.cnpj_regimes ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público
CREATE POLICY "Public can view all cnpj regimes" 
ON public.cnpj_regimes 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert cnpj regimes" 
ON public.cnpj_regimes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update cnpj regimes" 
ON public.cnpj_regimes 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete cnpj regimes" 
ON public.cnpj_regimes 
FOR DELETE 
USING (true);

-- Criar trigger para atualização automática de timestamp
CREATE TRIGGER update_cnpj_regimes_updated_at
BEFORE UPDATE ON public.cnpj_regimes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.cnpj_regimes IS 'Tabela para armazenar regimes tributários de CNPJs independente de empresas cadastradas';
COMMENT ON COLUMN public.cnpj_regimes.cnpj IS 'CNPJ da empresa (14 dígitos)';
COMMENT ON COLUMN public.cnpj_regimes.regime_tributario IS 'Regime tributário associado ao CNPJ';
