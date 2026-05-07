-- Add user_id column to wedding_gifts
ALTER TABLE public.wedding_gifts 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view wedding gifts" ON public.wedding_gifts;
DROP POLICY IF EXISTS "Anyone can insert wedding gifts" ON public.wedding_gifts;
DROP POLICY IF EXISTS "Anyone can update wedding gifts" ON public.wedding_gifts;
DROP POLICY IF EXISTS "Anyone can delete wedding gifts" ON public.wedding_gifts;

-- Create new RLS policies for user-specific data
CREATE POLICY "Users can view their own gifts" 
ON public.wedding_gifts 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gifts" 
ON public.wedding_gifts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gifts" 
ON public.wedding_gifts 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gifts" 
ON public.wedding_gifts 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);