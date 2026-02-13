
-- Project Memory: stores full AI Builder project state for multi-agent pipeline
CREATE TABLE public.project_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  
  -- Requirements Agent output
  requirements jsonb DEFAULT '[]'::jsonb,
  
  -- Product Manager Agent output
  modules jsonb DEFAULT '[]'::jsonb,
  workflow jsonb DEFAULT '{}'::jsonb,
  
  -- Architect Agent output
  folder_structure jsonb DEFAULT '{}'::jsonb,
  
  -- Database Agent output
  db_schema jsonb DEFAULT '[]'::jsonb,
  api_list jsonb DEFAULT '[]'::jsonb,
  
  -- UI/UX Agent output
  ui_components jsonb DEFAULT '[]'::jsonb,
  page_layouts jsonb DEFAULT '[]'::jsonb,
  
  -- Frontend Agent output
  generated_files jsonb DEFAULT '[]'::jsonb,
  
  -- Task Planner
  task_plan jsonb DEFAULT '[]'::jsonb,
  current_step integer DEFAULT 0,
  total_steps integer DEFAULT 0,
  
  -- Quality Score
  quality_score jsonb DEFAULT '{}'::jsonb,
  
  -- Suggestions for follow-up
  suggestions jsonb DEFAULT '[]'::jsonb,
  
  -- Agent execution log
  agent_log jsonb DEFAULT '[]'::jsonb,
  
  -- Status
  status text DEFAULT 'planning',
  error text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.project_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own project memory"
  ON public.project_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project memory"
  ON public.project_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project memory"
  ON public.project_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project memory"
  ON public.project_memory FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER update_project_memory_updated_at
  BEFORE UPDATE ON public.project_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
