-- Criar tabela para opções de "Se Aplica"
CREATE TABLE public.se_aplica_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.se_aplica_options ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para se_aplica_options
CREATE POLICY "Todos podem visualizar se_aplica_options"
  ON public.se_aplica_options
  FOR SELECT
  USING (true);

CREATE POLICY "Todos podem inserir se_aplica_options"
  ON public.se_aplica_options
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar se_aplica_options"
  ON public.se_aplica_options
  FOR UPDATE
  USING (true);

CREATE POLICY "Todos podem deletar se_aplica_options"
  ON public.se_aplica_options
  FOR DELETE
  USING (true);

-- Inserir alguns valores padrão
INSERT INTO public.se_aplica_options (nome) VALUES
  ('SN Serviços'),
  ('SN Comércio'),
  ('Lucro Real'),
  ('Lucro Presumido'),
  ('MEI')
ON CONFLICT (nome) DO NOTHING;