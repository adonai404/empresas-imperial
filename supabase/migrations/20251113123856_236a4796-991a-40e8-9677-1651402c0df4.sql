-- Create systems table
CREATE TABLE public.systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_links table
CREATE TABLE public.system_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT 'ExternalLink',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_links ENABLE ROW LEVEL SECURITY;

-- Create policies for systems (public access for now)
CREATE POLICY "Allow all access to systems" 
ON public.systems 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to system_links" 
ON public.system_links 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_system_links_system_id ON public.system_links(system_id);
CREATE INDEX idx_system_links_order ON public.system_links(system_id, order_index);

-- Create trigger for automatic timestamp updates on systems
CREATE TRIGGER update_systems_updated_at
BEFORE UPDATE ON public.systems
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();