
-- Webhooks table for persistent webhook configs
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhooks" ON public.webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own webhooks" ON public.webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own webhooks" ON public.webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own webhooks" ON public.webhooks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Collaboration messages table for real team chat
CREATE TABLE public.collaboration_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  display_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.collaboration_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view messages" ON public.collaboration_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can send messages" ON public.collaboration_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_messages;
