-- Add situacao column to operational_tasks table
ALTER TABLE public.operational_tasks 
ADD COLUMN situacao text DEFAULT 'Pendente';

-- Update existing completed tasks to have proper situacao
UPDATE public.operational_tasks 
SET situacao = CASE 
  WHEN completed = true THEN 'Concluído'
  ELSE 'Pendente'
END;