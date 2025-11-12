-- Adicionar coluna responsavel_id na tabela fiscal_data
ALTER TABLE public.fiscal_data 
ADD COLUMN responsavel_id UUID REFERENCES public.responsaveis(id) ON DELETE SET NULL;