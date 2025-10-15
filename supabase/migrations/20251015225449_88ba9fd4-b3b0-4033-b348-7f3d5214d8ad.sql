-- Create table for Produtor Rural data
CREATE TABLE public.produtor_rural_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  period TEXT NOT NULL,
  entradas NUMERIC,
  saidas NUMERIC,
  servicos NUMERIC,
  pis NUMERIC,
  cofins NUMERIC,
  icms NUMERIC,
  irpj_primeiro_trimestre NUMERIC,
  csll_primeiro_trimestre NUMERIC,
  irpj_segundo_trimestre NUMERIC,
  csll_segundo_trimestre NUMERIC,
  tvi NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.produtor_rural_data ENABLE ROW LEVEL SECURITY;

-- Create policies for Produtor Rural data
CREATE POLICY "Public can view all produtor rural data" 
ON public.produtor_rural_data 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert produtor rural data" 
ON public.produtor_rural_data 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update produtor rural data" 
ON public.produtor_rural_data 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete produtor rural data" 
ON public.produtor_rural_data 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_produtor_rural_data_updated_at
BEFORE UPDATE ON public.produtor_rural_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();