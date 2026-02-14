
-- Table for developer API keys
CREATE TABLE public.developer_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  label text NOT NULL DEFAULT 'Default',
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.developer_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view/manage their own keys
CREATE POLICY "Users can view own API keys"
ON public.developer_api_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
ON public.developer_api_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
ON public.developer_api_keys FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all keys (for lookup in edge function via service role)
CREATE POLICY "Admins can view all API keys"
ON public.developer_api_keys FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
