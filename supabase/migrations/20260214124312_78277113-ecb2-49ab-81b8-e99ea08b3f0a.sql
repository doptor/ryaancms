
-- Add price and commission fields to plugins
ALTER TABLE public.plugins
ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 20,
ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT true;

-- Orders table for tracking purchases
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  plugin_id uuid NOT NULL REFERENCES public.plugins(id),
  amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  developer_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'completed',
  payment_method text DEFAULT 'stripe',
  license_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Authenticated users can create orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Developer payouts table
CREATE TABLE public.developer_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payouts"
ON public.developer_payouts FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Developers can view own payouts"
ON public.developer_payouts FOR SELECT
USING (auth.uid() = developer_id);

-- Trigger for updated_at
CREATE TRIGGER update_developer_payouts_updated_at
BEFORE UPDATE ON public.developer_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
