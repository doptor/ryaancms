
-- Drop the existing circular INSERT policy
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Create a new policy that allows service_role OR existing admins to insert roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'role') = 'service_role'
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
