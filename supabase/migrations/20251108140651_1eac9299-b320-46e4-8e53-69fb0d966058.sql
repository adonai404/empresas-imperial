-- Remover o constraint check problemático da tabela companies
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_regime_check;

-- Adicionar um novo constraint que permite todos os regimes válidos
ALTER TABLE public.companies 
ADD CONSTRAINT companies_regime_check 
CHECK (regime_tributario IN ('lucro_real', 'lucro_presumido', 'simples_nacional', 'produtor_rural') OR regime_tributario IS NULL);