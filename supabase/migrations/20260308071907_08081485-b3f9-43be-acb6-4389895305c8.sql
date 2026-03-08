
-- EDUCA Settings table
CREATE TABLE IF NOT EXISTS public.educa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, setting_key)
);

ALTER TABLE public.educa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own educa settings" ON public.educa_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for educa documents
INSERT INTO storage.buckets (id, name, public) VALUES ('educa-documents', 'educa-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for educa-documents bucket
CREATE POLICY "Users can upload educa documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'educa-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own educa documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'educa-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own educa documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'educa-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
