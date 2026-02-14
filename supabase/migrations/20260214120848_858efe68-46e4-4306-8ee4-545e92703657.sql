-- Allow authenticated users to insert their own plugins (for uploaded/imported packages)
CREATE POLICY "Authenticated users can insert plugins"
ON public.plugins
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update plugins they authored
CREATE POLICY "Users can update plugins they authored"
ON public.plugins
FOR UPDATE
TO authenticated
USING (author = (SELECT email FROM auth.users WHERE id = auth.uid()));
