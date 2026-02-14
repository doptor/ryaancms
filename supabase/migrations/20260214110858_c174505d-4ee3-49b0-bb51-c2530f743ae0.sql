
-- Create storage bucket for site assets (logo, favicon, og images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own assets
CREATE POLICY "Users can update own site assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own assets
CREATE POLICY "Users can delete own site assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to site assets
CREATE POLICY "Site assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');
