-- Create segments table
CREATE TABLE public.segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

-- Create policies for segments (public access since companies use segments)
CREATE POLICY "Public can view all segments" 
ON public.segments 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert segments" 
ON public.segments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update segments" 
ON public.segments 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete segments" 
ON public.segments 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_segments_updated_at
BEFORE UPDATE ON public.segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();