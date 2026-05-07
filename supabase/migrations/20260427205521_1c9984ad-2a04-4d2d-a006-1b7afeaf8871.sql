-- Backfill gift_history with a synthetic 'create' entry for every existing
-- wedding_gifts record that has no history yet. Uses the gift's own created_at
-- so the timeline reflects when it was originally added (e.g. via Excel import).
INSERT INTO public.gift_history (gift_id, user_id, action, changes, snapshot, created_at)
SELECT 
  wg.id,
  wg.user_id,
  'create'::public.gift_history_action,
  NULL,
  to_jsonb(wg),
  COALESCE(wg.created_at, now())
FROM public.wedding_gifts wg
WHERE NOT EXISTS (
  SELECT 1 FROM public.gift_history gh WHERE gh.gift_id = wg.id
);