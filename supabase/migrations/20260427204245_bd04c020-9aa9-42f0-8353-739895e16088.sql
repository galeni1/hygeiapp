-- Action enum
CREATE TYPE public.gift_history_action AS ENUM ('create', 'update', 'delete', 'restore', 'permanent_delete');

-- History table
CREATE TABLE public.gift_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action public.gift_history_action NOT NULL,
  changes JSONB,
  snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_gift_history_gift_id ON public.gift_history(gift_id);
CREATE INDEX idx_gift_history_user_id ON public.gift_history(user_id);
CREATE INDEX idx_gift_history_created_at ON public.gift_history(created_at DESC);

ALTER TABLE public.gift_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own history
CREATE POLICY "Users can view their own gift history"
  ON public.gift_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for users — only the trigger (SECURITY DEFINER) writes.

-- Trigger function: log INSERT / UPDATE / DELETE
CREATE OR REPLACE FUNCTION public.log_wedding_gift_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_action public.gift_history_action;
  v_changes JSONB := '{}'::jsonb;
  v_snapshot JSONB;
  v_key TEXT;
  v_old JSONB;
  v_new JSONB;
  v_tracked TEXT[] := ARRAY[
    'source','number','village','guest_type','surname','first_name',
    'father_name','nickname','responsible','gift_amount','details'
  ];
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_user_id := NEW.user_id;
    v_action := 'create';
    v_snapshot := to_jsonb(NEW);
    INSERT INTO public.gift_history (gift_id, user_id, action, changes, snapshot)
    VALUES (NEW.id, v_user_id, v_action, NULL, v_snapshot);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);

    -- Detect soft delete vs restore
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'delete';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action := 'restore';
    ELSE
      v_action := 'update';
    END IF;

    -- Build changes diff for tracked fields
    FOREACH v_key IN ARRAY v_tracked LOOP
      IF (v_old->v_key) IS DISTINCT FROM (v_new->v_key) THEN
        v_changes := v_changes || jsonb_build_object(
          v_key,
          jsonb_build_object('old', v_old->v_key, 'new', v_new->v_key)
        );
      END IF;
    END LOOP;

    -- Skip noise: pure update with no field changes (e.g. only updated_at)
    IF v_action = 'update' AND v_changes = '{}'::jsonb THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.gift_history (gift_id, user_id, action, changes, snapshot)
    VALUES (NEW.id, v_user_id, v_action, NULLIF(v_changes, '{}'::jsonb), v_new);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_snapshot := to_jsonb(OLD);
    INSERT INTO public.gift_history (gift_id, user_id, action, changes, snapshot)
    VALUES (OLD.id, v_user_id, 'permanent_delete', NULL, v_snapshot);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_wedding_gifts_history
AFTER INSERT OR UPDATE OR DELETE ON public.wedding_gifts
FOR EACH ROW EXECUTE FUNCTION public.log_wedding_gift_history();