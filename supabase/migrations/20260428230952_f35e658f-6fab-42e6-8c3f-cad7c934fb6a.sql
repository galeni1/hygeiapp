-- 1. Add entity_type column to gift_history to distinguish between received gifts and given gifts
ALTER TABLE public.gift_history
ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'wedding_gift';

-- 2. Create the given_gifts table
CREATE TABLE public.given_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  number INTEGER,
  surname TEXT NOT NULL,
  first_name TEXT NOT NULL,
  father_name TEXT,
  nickname TEXT,
  village TEXT,
  relationship TEXT,
  event_type TEXT,
  event_date DATE,
  gift_amount NUMERIC,
  details TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.given_gifts ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies (per-user isolation)
CREATE POLICY "Users can view their own given gifts"
ON public.given_gifts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own given gifts"
ON public.given_gifts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own given gifts"
ON public.given_gifts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own given gifts"
ON public.given_gifts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. updated_at trigger
CREATE TRIGGER update_given_gifts_updated_at
BEFORE UPDATE ON public.given_gifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. History trigger function for given_gifts
CREATE OR REPLACE FUNCTION public.log_given_gift_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_action public.gift_history_action;
  v_changes JSONB := '{}'::jsonb;
  v_snapshot JSONB;
  v_key TEXT;
  v_old JSONB;
  v_new JSONB;
  v_tracked TEXT[] := ARRAY[
    'number','surname','first_name','father_name','nickname',
    'village','relationship','event_type','event_date','gift_amount','details'
  ];
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_user_id := NEW.user_id;
    v_action := 'create';
    v_snapshot := to_jsonb(NEW);
    INSERT INTO public.gift_history (gift_id, user_id, action, changes, snapshot, entity_type)
    VALUES (NEW.id, v_user_id, v_action, NULL, v_snapshot, 'given_gift');
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);

    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'delete';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action := 'restore';
    ELSE
      v_action := 'update';
    END IF;

    FOREACH v_key IN ARRAY v_tracked LOOP
      IF (v_old->v_key) IS DISTINCT FROM (v_new->v_key) THEN
        v_changes := v_changes || jsonb_build_object(
          v_key,
          jsonb_build_object('old', v_old->v_key, 'new', v_new->v_key)
        );
      END IF;
    END LOOP;

    IF v_action = 'update' AND v_changes = '{}'::jsonb THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.gift_history (gift_id, user_id, action, changes, snapshot, entity_type)
    VALUES (NEW.id, v_user_id, v_action, NULLIF(v_changes, '{}'::jsonb), v_new, 'given_gift');
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_snapshot := to_jsonb(OLD);
    INSERT INTO public.gift_history (gift_id, user_id, action, changes, snapshot, entity_type)
    VALUES (OLD.id, v_user_id, 'permanent_delete', NULL, v_snapshot, 'given_gift');
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$function$;

-- 7. Attach the history trigger
CREATE TRIGGER given_gifts_history_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.given_gifts
FOR EACH ROW
EXECUTE FUNCTION public.log_given_gift_history();

-- 8. Indexes
CREATE INDEX idx_given_gifts_user_id ON public.given_gifts(user_id);
CREATE INDEX idx_given_gifts_event_date ON public.given_gifts(event_date);
CREATE INDEX idx_given_gifts_deleted_at ON public.given_gifts(deleted_at);