-- Create a table for obligation tasks (Obrigações a serem entregues)
CREATE TABLE public.obligation_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competencia_id UUID REFERENCES public.competencias(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  tarefa TEXT NOT NULL,
  se_aplica TEXT NOT NULL,
  responsaveis TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.obligation_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Todos podem visualizar obrigações" 
ON public.obligation_tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Todos podem inserir obrigações" 
ON public.obligation_tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar obrigações" 
ON public.obligation_tasks 
FOR UPDATE 
USING (true);

CREATE POLICY "Todos podem deletar obrigações" 
ON public.obligation_tasks 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_obligation_tasks_updated_at
BEFORE UPDATE ON public.obligation_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();