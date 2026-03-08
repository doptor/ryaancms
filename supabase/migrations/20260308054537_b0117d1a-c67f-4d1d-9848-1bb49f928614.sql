-- Phase 2: Income & Expense Tables for Accounting Plugin

-- Create Expense Categories Table
CREATE TABLE public.ac_expense_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.ac_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.ac_expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their expense categories" 
ON public.ac_expense_categories 
FOR ALL USING (auth.uid() = user_id);

-- Create Income Table
CREATE TABLE public.ac_income (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.ac_companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.ac_customers(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.ac_accounts(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    currency_code TEXT DEFAULT 'USD',
    income_date DATE NOT NULL,
    category TEXT,
    payment_method TEXT,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    tax_rate_id UUID REFERENCES public.ac_tax_rates(id) ON DELETE SET NULL,
    description TEXT,
    reference TEXT,
    attachment TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.ac_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their income" 
ON public.ac_income 
FOR ALL USING (auth.uid() = user_id);

-- Create Expenses Table
CREATE TABLE public.ac_expenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.ac_companies(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.ac_vendors(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.ac_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.ac_expense_categories(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency_code TEXT DEFAULT 'USD',
    expense_date DATE NOT NULL,
    payment_method TEXT,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    tax_rate_id UUID REFERENCES public.ac_tax_rates(id) ON DELETE SET NULL,
    description TEXT,
    reference TEXT,
    receipt_path TEXT,
    is_billable BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT,
    approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.ac_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their expenses" 
ON public.ac_expenses 
FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_ac_expense_categories_updated_at 
BEFORE UPDATE ON public.ac_expense_categories 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ac_income_updated_at 
BEFORE UPDATE ON public.ac_income 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ac_expenses_updated_at 
BEFORE UPDATE ON public.ac_expenses 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();