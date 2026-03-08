-- Phase 3: Invoices & Payments Tables for Accounting Plugin

-- Create Invoices Table
CREATE TABLE public.ac_invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.ac_companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.ac_customers(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')) DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    discount_type TEXT CHECK (discount_type IN ('fixed', 'percentage')) DEFAULT 'fixed',
    total_amount NUMERIC(15,2) DEFAULT 0,
    amount_paid NUMERIC(15,2) DEFAULT 0,
    amount_due NUMERIC(15,2) DEFAULT 0,
    currency_code TEXT DEFAULT 'USD',
    exchange_rate NUMERIC(15,6) DEFAULT 1,
    notes TEXT,
    terms TEXT,
    template TEXT DEFAULT 'default',
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT,
    late_fee NUMERIC(15,2) DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.ac_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their invoices" 
ON public.ac_invoices 
FOR ALL USING (auth.uid() = user_id);

-- Create Invoice Items Table
CREATE TABLE public.ac_invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.ac_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    discount NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) NOT NULL,
    account_id UUID REFERENCES public.ac_accounts(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.ac_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their invoice items" 
ON public.ac_invoice_items 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.ac_invoices 
        WHERE ac_invoices.id = ac_invoice_items.invoice_id 
        AND ac_invoices.user_id = auth.uid()
    )
);

-- Create Payments Table
CREATE TABLE public.ac_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.ac_companies(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.ac_invoices(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.ac_customers(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES public.ac_accounts(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    currency_code TEXT DEFAULT 'USD',
    exchange_rate NUMERIC(15,6) DEFAULT 1,
    payment_method TEXT NOT NULL,
    transaction_reference TEXT,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
    type TEXT CHECK (type IN ('received', 'sent', 'refund')) DEFAULT 'received',
    payment_date DATE NOT NULL,
    notes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.ac_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their payments" 
ON public.ac_payments 
FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_ac_invoices_updated_at 
BEFORE UPDATE ON public.ac_invoices 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ac_invoice_items_updated_at 
BEFORE UPDATE ON public.ac_invoice_items 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ac_payments_updated_at 
BEFORE UPDATE ON public.ac_payments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ac_invoices_customer ON public.ac_invoices(customer_id);
CREATE INDEX idx_ac_invoices_status ON public.ac_invoices(status);
CREATE INDEX idx_ac_invoices_due_date ON public.ac_invoices(due_date);
CREATE INDEX idx_ac_invoice_items_invoice ON public.ac_invoice_items(invoice_id);
CREATE INDEX idx_ac_payments_invoice ON public.ac_payments(invoice_id);
CREATE INDEX idx_ac_payments_customer ON public.ac_payments(customer_id);