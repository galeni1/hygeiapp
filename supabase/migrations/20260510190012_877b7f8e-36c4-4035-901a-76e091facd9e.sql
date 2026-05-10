CREATE TABLE public.symptoms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  observed_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  body_part TEXT,
  description TEXT NOT NULL,
  severity SMALLINT,
  notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own symptoms" ON public.symptoms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own symptoms" ON public.symptoms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own symptoms" ON public.symptoms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own symptoms" ON public.symptoms FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_symptoms_updated_at
BEFORE UPDATE ON public.symptoms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_symptoms_user_date ON public.symptoms(user_id, observed_date DESC);
CREATE INDEX idx_symptoms_body_part ON public.symptoms(user_id, body_part);