
-- Menu groups table
CREATE TABLE public.menu_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'header' CHECK (position IN ('header', 'footer', 'sidebar', 'dashboard-sidebar', 'dashboard-header')),
  target TEXT NOT NULL DEFAULT 'frontend' CHECK (target IN ('frontend', 'dashboard')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.menu_groups(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'custom' CHECK (link_type IN ('custom', 'page', 'plugin', 'external')),
  url TEXT,
  plugin_slug TEXT,
  icon TEXT,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.menu_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own menu groups" ON public.menu_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own menu groups" ON public.menu_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own menu groups" ON public.menu_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own menu groups" ON public.menu_groups FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own menu items" ON public.menu_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own menu items" ON public.menu_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own menu items" ON public.menu_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own menu items" ON public.menu_items FOR DELETE USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_menu_groups_updated_at BEFORE UPDATE ON public.menu_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
