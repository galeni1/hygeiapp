-- Create table for wedding gifts
CREATE TABLE public.wedding_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(10),
  number INTEGER,
  village TEXT,
  guest_type VARCHAR(10),
  surname TEXT NOT NULL,
  first_name TEXT NOT NULL,
  father_name TEXT,
  nickname TEXT,
  responsible TEXT,
  gift_amount DECIMAL(10,2),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wedding_gifts ENABLE ROW LEVEL SECURITY;

-- Since this is a personal family app, allow all authenticated users to read
CREATE POLICY "Anyone can view wedding gifts" 
ON public.wedding_gifts 
FOR SELECT 
USING (true);

-- Anyone can insert wedding gifts
CREATE POLICY "Anyone can insert wedding gifts" 
ON public.wedding_gifts 
FOR INSERT 
WITH CHECK (true);

-- Anyone can update wedding gifts
CREATE POLICY "Anyone can update wedding gifts" 
ON public.wedding_gifts 
FOR UPDATE 
USING (true);

-- Anyone can delete wedding gifts
CREATE POLICY "Anyone can delete wedding gifts" 
ON public.wedding_gifts 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wedding_gifts_updated_at
BEFORE UPDATE ON public.wedding_gifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();