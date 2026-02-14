
CREATE TABLE public.published_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_title TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.published_previews ENABLE ROW LEVEL SECURITY;

-- Anyone can view published previews (public website)
CREATE POLICY "Published previews are publicly viewable"
ON public.published_previews
FOR SELECT
USING (true);

-- Only owners can insert/update their previews
CREATE POLICY "Users can insert their own previews"
ON public.published_previews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own previews"
ON public.published_previews
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own previews"
ON public.published_previews
FOR DELETE
USING (auth.uid() = user_id);
