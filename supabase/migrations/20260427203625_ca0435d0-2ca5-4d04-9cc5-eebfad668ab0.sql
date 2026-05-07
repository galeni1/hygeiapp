ALTER TABLE public.wedding_gifts ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_wedding_gifts_deleted_at ON public.wedding_gifts(deleted_at);