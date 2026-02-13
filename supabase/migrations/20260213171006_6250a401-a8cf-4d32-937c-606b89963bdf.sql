
-- Create releases table to track versions
CREATE TABLE public.releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  release_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'success'
);

-- Enable RLS
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;

-- Public read access (releases are public)
CREATE POLICY "Releases are publicly readable"
ON public.releases
FOR SELECT
USING (true);

-- Only service role can insert (from edge function)
CREATE POLICY "Service role can insert releases"
ON public.releases
FOR INSERT
WITH CHECK (false);
