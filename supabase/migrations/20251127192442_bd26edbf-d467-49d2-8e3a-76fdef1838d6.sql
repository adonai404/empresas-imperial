-- Create table for declaration options
CREATE TABLE public.declaracao_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.declaracao_options ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Todos podem visualizar declaracao_options" 
ON public.declaracao_options 
FOR SELECT 
USING (true);

CREATE POLICY "Todos podem inserir declaracao_options" 
ON public.declaracao_options 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar declaracao_options" 
ON public.declaracao_options 
FOR UPDATE 
USING (true);

CREATE POLICY "Todos podem deletar declaracao_options" 
ON public.declaracao_options 
FOR DELETE 
USING (true);

-- Insert some default options
INSERT INTO public.declaracao_options (nome) VALUES 
  ('SPED FISCAL'),
  ('SPED CONTRIBUIÇÕES'),
  ('MIT'),
  ('EFD REINF'),
  ('DCTF'),
  ('ECF'),
  ('ECD');