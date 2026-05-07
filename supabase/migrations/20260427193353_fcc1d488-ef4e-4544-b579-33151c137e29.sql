-- Create table for per-user list of "πηγές" (sources) like Γαμπρός, Νύφη, Κουμπάρος Μανώλης
CREATE TABLE public.gift_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.gift_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sources"
ON public.gift_sources FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sources"
ON public.gift_sources FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sources"
ON public.gift_sources FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sources"
ON public.gift_sources FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_gift_sources_updated_at
BEFORE UPDATE ON public.gift_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gift_sources_user_id ON public.gift_sources(user_id);