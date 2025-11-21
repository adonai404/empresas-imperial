-- Criar tabela para tarefas operacionais
CREATE TABLE public.operational_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  periodo TEXT NOT NULL,
  tarefa TEXT NOT NULL,
  se_aplica TEXT NOT NULL,
  responsaveis TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.operational_tasks ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Todos podem visualizar tarefas operacionais"
ON public.operational_tasks
FOR SELECT
USING (true);

-- Política para permitir inserção (você pode ajustar conforme necessário)
CREATE POLICY "Todos podem inserir tarefas operacionais"
ON public.operational_tasks
FOR INSERT
WITH CHECK (true);

-- Política para permitir atualização
CREATE POLICY "Todos podem atualizar tarefas operacionais"
ON public.operational_tasks
FOR UPDATE
USING (true);

-- Política para permitir exclusão
CREATE POLICY "Todos podem deletar tarefas operacionais"
ON public.operational_tasks
FOR DELETE
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_operational_tasks_updated_at
BEFORE UPDATE ON public.operational_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para ordenação
CREATE INDEX idx_operational_tasks_order ON public.operational_tasks(order_index);