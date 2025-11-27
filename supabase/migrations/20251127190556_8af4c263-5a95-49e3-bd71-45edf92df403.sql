-- Tabela para gerenciar projetos/obrigações
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_projeto TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberto',
  prioridade TEXT NOT NULL DEFAULT 'Média',
  prazo_final DATE,
  data_conclusao DATE,
  declaracoes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Todos podem visualizar projetos" 
ON public.projects 
FOR SELECT 
USING (true);

CREATE POLICY "Todos podem inserir projetos" 
ON public.projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar projetos" 
ON public.projects 
FOR UPDATE 
USING (true);

CREATE POLICY "Todos podem deletar projetos" 
ON public.projects 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();