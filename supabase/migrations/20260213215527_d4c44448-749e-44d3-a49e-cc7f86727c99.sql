
-- Build analytics table
CREATE TABLE public.build_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt text NOT NULL,
  project_title text,
  components_used jsonb DEFAULT '[]'::jsonb,
  component_count integer DEFAULT 0,
  page_count integer DEFAULT 0,
  collection_count integer DEFAULT 0,
  security_score integer DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  duration_ms integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.build_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics" ON public.build_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.build_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Approval workflows table
CREATE TABLE public.deploy_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_title text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  schema_sql text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deploy_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own approvals" ON public.deploy_approvals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own approvals" ON public.deploy_approvals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own approvals" ON public.deploy_approvals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own approvals" ON public.deploy_approvals
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_deploy_approvals_updated_at
  BEFORE UPDATE ON public.deploy_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
