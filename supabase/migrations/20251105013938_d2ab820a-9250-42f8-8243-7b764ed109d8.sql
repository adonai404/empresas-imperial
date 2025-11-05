-- Primeiro, atualizar empresas existentes que são MEI para simples_nacional
UPDATE public.companies 
SET regime_tributario = 'simples_nacional' 
WHERE regime_tributario = 'mei';

-- Atualizar cnpj_regimes também se houver
UPDATE public.cnpj_regimes 
SET regime_tributario = 'simples_nacional' 
WHERE regime_tributario = 'mei';

-- Remover 'mei' do enum e adicionar 'produtor_rural'
-- Primeiro criar um novo tipo com os valores corretos
CREATE TYPE regime_tributario_new AS ENUM ('lucro_real', 'lucro_presumido', 'simples_nacional', 'produtor_rural');

-- Alterar as colunas para usar o novo tipo
ALTER TABLE public.companies 
  ALTER COLUMN regime_tributario TYPE regime_tributario_new 
  USING regime_tributario::text::regime_tributario_new;

ALTER TABLE public.cnpj_regimes 
  ALTER COLUMN regime_tributario TYPE regime_tributario_new 
  USING regime_tributario::text::regime_tributario_new;

-- Remover o tipo antigo e renomear o novo
DROP TYPE IF EXISTS regime_tributario;
ALTER TYPE regime_tributario_new RENAME TO regime_tributario;