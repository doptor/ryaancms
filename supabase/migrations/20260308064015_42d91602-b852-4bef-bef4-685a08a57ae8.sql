
-- AI Communication Plugin Schema

-- Contacts for communication
CREATE TABLE public.comm_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  company TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  source TEXT DEFAULT 'manual',
  is_active BOOLEAN DEFAULT true,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  total_calls INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.comm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own comm contacts" ON public.comm_contacts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_comm_contacts_user ON public.comm_contacts(user_id);
CREATE INDEX idx_comm_contacts_phone ON public.comm_contacts(phone);

-- Agents
CREATE TABLE public.comm_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'agent',
  status TEXT DEFAULT 'offline',
  max_concurrent_calls INTEGER DEFAULT 3,
  skills TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  total_calls INTEGER DEFAULT 0,
  avg_handle_time NUMERIC DEFAULT 0,
  satisfaction_score NUMERIC DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.comm_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own comm agents" ON public.comm_agents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI Conversation Scripts
CREATE TABLE public.comm_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'voice',
  language TEXT DEFAULT 'en',
  steps JSONB DEFAULT '[]'::jsonb,
  ai_model TEXT DEFAULT 'gemini-2.5-flash',
  voice_id TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.comm_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own comm scripts" ON public.comm_scripts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Campaigns
CREATE TABLE public.comm_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'voice',
  script_id UUID REFERENCES public.comm_scripts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_contacts INTEGER DEFAULT 0,
  contacted INTEGER DEFAULT 0,
  successful INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  contact_filter JSONB DEFAULT '{}'::jsonb,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.comm_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own comm campaigns" ON public.comm_campaigns FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Voice Calls
CREATE TABLE public.comm_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.comm_contacts(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.comm_agents(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.comm_campaigns(id) ON DELETE SET NULL,
  script_id UUID REFERENCES public.comm_scripts(id) ON DELETE SET NULL,
  direction TEXT DEFAULT 'outbound',
  call_type TEXT DEFAULT 'ai',
  status TEXT DEFAULT 'initiated',
  from_number TEXT,
  to_number TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  answered_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0,
  recording_url TEXT,
  transcription TEXT,
  ai_summary TEXT,
  sentiment TEXT,
  cost NUMERIC DEFAULT 0,
  provider TEXT DEFAULT 'twilio',
  provider_call_id TEXT,
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.comm_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own comm calls" ON public.comm_calls FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_comm_calls_contact ON public.comm_calls(contact_id);
CREATE INDEX idx_comm_calls_status ON public.comm_calls(status);

-- WhatsApp Messages
CREATE TABLE public.comm_whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.comm_contacts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.comm_campaigns(id) ON DELETE SET NULL,
  direction TEXT DEFAULT 'outbound',
  message_type TEXT DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  template_name TEXT,
  status TEXT DEFAULT 'sent',
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  is_bot_response BOOLEAN DEFAULT false,
  ai_generated BOOLEAN DEFAULT false,
  provider_message_id TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.comm_whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own whatsapp messages" ON public.comm_whatsapp_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_comm_wa_contact ON public.comm_whatsapp_messages(contact_id);

-- Conversations (unified thread tracking)
CREATE TABLE public.comm_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.comm_contacts(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'whatsapp',
  status TEXT DEFAULT 'open',
  assigned_agent_id UUID REFERENCES public.comm_agents(id) ON DELETE SET NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  is_bot_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.comm_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations" ON public.comm_conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Communication Settings
CREATE TABLE public.comm_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  category TEXT DEFAULT 'general',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, setting_key)
);
ALTER TABLE public.comm_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own comm settings" ON public.comm_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
