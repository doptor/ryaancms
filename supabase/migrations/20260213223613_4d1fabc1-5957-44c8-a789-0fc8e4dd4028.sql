
-- Plugin registry table
CREATE TABLE public.plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'plugin',
  version TEXT NOT NULL DEFAULT '1.0.0',
  author TEXT DEFAULT 'RyaanCMS',
  icon TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  config_schema JSONB DEFAULT '{}',
  is_official BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User installed plugins
CREATE TABLE public.user_plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plugin_id UUID NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, plugin_id)
);

-- Enable RLS
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plugins ENABLE ROW LEVEL SECURITY;

-- Plugins are publicly readable
CREATE POLICY "Plugins are publicly readable" ON public.plugins FOR SELECT USING (true);

-- User plugins policies
CREATE POLICY "Users can view own installed plugins" ON public.user_plugins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can install plugins" ON public.user_plugins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plugins" ON public.user_plugins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can uninstall plugins" ON public.user_plugins FOR DELETE USING (auth.uid() = user_id);

-- Seed official plugins
INSERT INTO public.plugins (name, slug, description, category, version, author, rating, install_count, tags, is_official) VALUES
('Stripe Payments', 'stripe-payments', 'Accept payments with Stripe. Supports one-time and subscription billing.', 'plugin', '2.1.0', 'RyaanCMS', 4.9, 12400, ARRAY['payments', 'stripe', 'billing'], true),
('SMS Gateway', 'sms-gateway', 'Send SMS notifications via Twilio, Vonage, or AWS SNS.', 'plugin', '1.5.0', 'RyaanCMS', 4.7, 8200, ARRAY['sms', 'notifications', 'twilio'], true),
('WhatsApp API', 'whatsapp-api', 'WhatsApp Business API integration for messaging and notifications.', 'plugin', '1.3.0', 'RyaanCMS', 4.8, 15100, ARRAY['whatsapp', 'messaging', 'chat'], true),
('Email Marketing', 'email-marketing', 'Email campaigns with templates, scheduling, and analytics. Supports SendGrid and Mailgun.', 'plugin', '2.0.0', 'RyaanCMS', 4.6, 9800, ARRAY['email', 'marketing', 'campaigns'], true),
('PDF Invoice Generator', 'pdf-invoices', 'Generate professional PDF invoices with customizable templates.', 'plugin', '1.8.0', 'RyaanCMS', 4.5, 6300, ARRAY['pdf', 'invoices', 'billing'], true),
('SEO Pro', 'seo-pro', 'Advanced SEO toolkit with meta tags, sitemap, and AI-powered suggestions.', 'plugin', '3.0.0', 'RyaanCMS', 4.9, 18500, ARRAY['seo', 'meta', 'sitemap'], true),
('AI Content Writer', 'ai-content-writer', 'Generate blog posts, product descriptions, and marketing copy with AI.', 'plugin', '3.2.0', 'RyaanCMS', 4.8, 21000, ARRAY['ai', 'content', 'writing'], true),
('Multi-Language (i18n)', 'i18n', 'Internationalization with AI-powered translation support for 50+ languages.', 'plugin', '1.4.0', 'RyaanCMS', 4.4, 5900, ARRAY['i18n', 'translation', 'languages'], true),
('Analytics Dashboard', 'analytics-dashboard', 'Real-time analytics with custom dashboards, funnels, and cohort analysis.', 'plugin', '2.5.0', 'RyaanCMS', 4.7, 11200, ARRAY['analytics', 'dashboard', 'reports'], true),
('Form Builder', 'form-builder', 'Drag-and-drop form builder with validation, conditional logic, and webhooks.', 'plugin', '2.0.0', 'RyaanCMS', 4.7, 14300, ARRAY['forms', 'builder', 'validation'], true),
('File Manager', 'file-manager', 'Cloud file storage with drag-drop upload, image optimization, and CDN delivery.', 'plugin', '1.6.0', 'RyaanCMS', 4.5, 7800, ARRAY['files', 'storage', 'upload'], true),
('Social Auth', 'social-auth', 'One-click social login with Google, GitHub, Facebook, and Apple.', 'plugin', '1.2.0', 'RyaanCMS', 4.8, 16700, ARRAY['auth', 'social', 'oauth'], true);

-- Trigger for updated_at
CREATE TRIGGER update_user_plugins_updated_at BEFORE UPDATE ON public.user_plugins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plugins_updated_at BEFORE UPDATE ON public.plugins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
