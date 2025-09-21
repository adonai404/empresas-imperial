-- Adicionar campos de segmento e regime tributário à tabela companies
ALTER TABLE public.companies 
ADD COLUMN segmento TEXT,
ADD COLUMN regime_tributario TEXT;

-- Criar um tipo ENUM para os regimes tributários
CREATE TYPE regime_tributario_type AS ENUM (
  'lucro_real',
  'lucro_presumido', 
  'simples_nacional',
  'mei'
);

-- Atualizar a coluna para usar o ENUM
ALTER TABLE public.companies 
ALTER COLUMN regime_tributario TYPE regime_tributario_type USING regime_tributario::regime_tributario_type;

-- Criar índices para melhor performance nas consultas
CREATE INDEX idx_companies_regime_tributario ON public.companies(regime_tributario);
CREATE INDEX idx_companies_segmento ON public.companies(segmento);

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.companies.segmento IS 'Segmento de atuação da empresa (ex: Comércio, Serviços, Indústria, etc.)';
COMMENT ON COLUMN public.companies.regime_tributario IS 'Regime tributário da empresa';

-- Atualizar a função de atualização de timestamp se necessário
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;