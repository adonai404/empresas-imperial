-- Remover o constraint check problemático da tabela cnpj_regimes
ALTER TABLE public.cnpj_regimes DROP CONSTRAINT IF EXISTS cnpj_regimes_regime_check;

-- Adicionar um novo constraint que permite todos os regimes válidos
ALTER TABLE public.cnpj_regimes 
ADD CONSTRAINT cnpj_regimes_regime_check 
CHECK (regime_tributario IN ('lucro_real', 'lucro_presumido', 'simples_nacional', 'produtor_rural'));