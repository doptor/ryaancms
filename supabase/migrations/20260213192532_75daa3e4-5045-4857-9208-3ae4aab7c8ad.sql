ALTER TABLE public.menu_items ADD COLUMN position text NOT NULL DEFAULT 'header';

ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_position_check CHECK (position = ANY (ARRAY['header'::text, 'footer'::text, 'sidebar'::text, 'dashboard-header'::text, 'dashboard-footer'::text]));