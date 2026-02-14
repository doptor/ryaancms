-- 1. Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. RLS for user_roles: only admins can manage, users can read own
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Add approval columns to plugins table
ALTER TABLE public.plugins
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS demo_url text,
ADD COLUMN IF NOT EXISTS download_url text,
ADD COLUMN IF NOT EXISTS reviewer_notes text,
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

-- 5. Set existing plugins as approved
UPDATE public.plugins SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = 'approved';

-- 6. Update plugins SELECT policy to show: approved to all, pending to submitter and admins
DROP POLICY IF EXISTS "Plugins are publicly readable" ON public.plugins;

CREATE POLICY "Plugins visible based on status"
ON public.plugins FOR SELECT
USING (
  approval_status = 'approved'
  OR submitted_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- 7. Allow admins to update any plugin (for approval)
DROP POLICY IF EXISTS "Users can update plugins they authored" ON public.plugins;

CREATE POLICY "Admins can update plugins"
ON public.plugins FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Update INSERT policy to set submitted_by
DROP POLICY IF EXISTS "Authenticated users can insert plugins" ON public.plugins;

CREATE POLICY "Authenticated users can submit plugins"
ON public.plugins FOR INSERT
TO authenticated
WITH CHECK (submitted_by = auth.uid());
