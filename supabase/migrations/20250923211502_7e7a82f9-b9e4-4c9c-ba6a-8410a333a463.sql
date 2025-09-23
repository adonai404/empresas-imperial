-- Create table for Lucro Real fiscal data
CREATE TABLE public.lucro_real_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  period TEXT NOT NULL,
  entradas NUMERIC,
  saidas NUMERIC,
  pis NUMERIC,
  cofins NUMERIC,
  icms NUMERIC,
  irpj_primeiro_trimestre NUMERIC,
  csll_primeiro_trimestre NUMERIC,
  irpj_segundo_trimestre NUMERIC,
  csll_segundo_trimestre NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lucro_real_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can view all lucro real data" 
ON public.lucro_real_data 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert lucro real data" 
ON public.lucro_real_data 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update lucro real data" 
ON public.lucro_real_data 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete lucro real data" 
ON public.lucro_real_data 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lucro_real_data_updated_at
BEFORE UPDATE ON public.lucro_real_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();