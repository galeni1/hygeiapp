
-- Personal events table
CREATE TABLE public.personal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  event_type TEXT,
  event_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personal events"
  ON public.personal_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal events"
  ON public.personal_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal events"
  ON public.personal_events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal events"
  ON public.personal_events FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_personal_events_updated_at
  BEFORE UPDATE ON public.personal_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_personal_events_user_id ON public.personal_events(user_id);

-- Add event_id to wedding_gifts (nullable for existing rows)
ALTER TABLE public.wedding_gifts
  ADD COLUMN event_id UUID REFERENCES public.personal_events(id) ON DELETE SET NULL;

CREATE INDEX idx_wedding_gifts_event_id ON public.wedding_gifts(event_id);
