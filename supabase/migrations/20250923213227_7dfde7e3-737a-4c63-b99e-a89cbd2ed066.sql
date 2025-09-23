-- Add foreign key constraint between lucro_real_data and companies
ALTER TABLE public.lucro_real_data 
ADD CONSTRAINT fk_lucro_real_data_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Add unique constraint for company_id and period to enable upsert
ALTER TABLE public.lucro_real_data 
ADD CONSTRAINT uk_lucro_real_data_company_period 
UNIQUE (company_id, period);