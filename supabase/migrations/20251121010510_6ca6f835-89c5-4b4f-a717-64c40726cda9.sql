-- Criar tabela de competências
CREATE TABLE public.competencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(nome)
);

-- Enable RLS
ALTER TABLE public.competencias ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para competencias
CREATE POLICY "Todos podem visualizar competencias"
ON public.competencias
FOR SELECT
USING (true);

CREATE POLICY "Todos podem inserir competencias"
ON public.competencias
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar competencias"
ON public.competencias
FOR UPDATE
USING (true);

CREATE POLICY "Todos podem deletar competencias"
ON public.competencias
FOR DELETE
USING (true);

-- Adicionar competencia_id na tabela operational_tasks
ALTER TABLE public.operational_tasks
ADD COLUMN competencia_id UUID REFERENCES public.competencias(id) ON DELETE CASCADE;

-- Trigger para updated_at em competencias
CREATE TRIGGER update_competencias_updated_at
BEFORE UPDATE ON public.competencias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();