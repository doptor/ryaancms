
-- Add logo_url and brand_name columns to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS brand_name text;

-- Create storage bucket for project logos
INSERT INTO storage.buckets (id, name, public) VALUES ('project-logos', 'project-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos
CREATE POLICY "Users can upload project logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-logos' AND auth.uid() IS NOT NULL);

-- Allow public read access to logos
CREATE POLICY "Project logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-logos');

-- Allow users to update their own logos
CREATE POLICY "Users can update project logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-logos' AND auth.uid() IS NOT NULL);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete project logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-logos' AND auth.uid() IS NOT NULL);
