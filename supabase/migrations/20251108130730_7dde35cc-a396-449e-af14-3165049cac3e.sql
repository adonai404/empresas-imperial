-- Habilitar RLS na tabela cnpj_regimes
ALTER TABLE public.cnpj_regimes ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública dos regimes de CNPJ
CREATE POLICY "Permitir leitura pública de regimes de CNPJ"
ON public.cnpj_regimes
FOR SELECT
USING (true);

-- Criar política para permitir inserção pública de regimes de CNPJ
CREATE POLICY "Permitir inserção pública de regimes de CNPJ"
ON public.cnpj_regimes
FOR INSERT
WITH CHECK (true);

-- Criar política para permitir atualização pública de regimes de CNPJ
CREATE POLICY "Permitir atualização pública de regimes de CNPJ"
ON public.cnpj_regimes
FOR UPDATE
USING (true);

-- Criar política para permitir exclusão pública de regimes de CNPJ
CREATE POLICY "Permitir exclusão pública de regimes de CNPJ"
ON public.cnpj_regimes
FOR DELETE
USING (true);