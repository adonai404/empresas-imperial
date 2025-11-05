-- Criar tabela de responsáveis
CREATE TABLE IF NOT EXISTS public.responsaveis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Public can view all responsaveis"
ON public.responsaveis
FOR SELECT
USING (true);

CREATE POLICY "Public can insert responsaveis"
ON public.responsaveis
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update responsaveis"
ON public.responsaveis
FOR UPDATE
USING (true);

CREATE POLICY "Public can delete responsaveis"
ON public.responsaveis
FOR DELETE
USING (true);

-- Adicionar coluna responsavel_id à tabela lucro_real_data
ALTER TABLE public.lucro_real_data 
ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES public.responsaveis(id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_responsaveis_updated_at
BEFORE UPDATE ON public.responsaveis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();