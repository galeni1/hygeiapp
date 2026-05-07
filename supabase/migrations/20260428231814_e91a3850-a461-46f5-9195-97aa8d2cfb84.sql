CREATE TABLE public.given_event_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.given_event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event types"
ON public.given_event_types FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event types"
ON public.given_event_types FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event types"
ON public.given_event_types FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event types"
ON public.given_event_types FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_given_event_types_updated_at
BEFORE UPDATE ON public.given_event_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();