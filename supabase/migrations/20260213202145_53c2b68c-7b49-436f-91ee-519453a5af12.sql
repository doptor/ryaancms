-- Fix 1: Add DELETE policy for profiles table
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Fix 2: Fix releases INSERT policy to properly allow service_role
DROP POLICY "Service role can insert releases" ON public.releases;
CREATE POLICY "Service role can insert releases"
ON public.releases
FOR INSERT
WITH CHECK ((auth.jwt()->>'role') = 'service_role');