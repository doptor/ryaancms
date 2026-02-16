
-- Fix project-logos storage policies to enforce user-scoped folder isolation
DROP POLICY IF EXISTS "Users can upload project logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update project logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete project logos" ON storage.objects;

CREATE POLICY "Users can upload own project logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own project logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own project logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
