-- Phase 1 Foundation Tables for Accounting Plugin

-- Create Companies Table
CREATE TABLE public.ac_companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    currency_code TEXT DEFAULT 'USD',
    fiscal_year_start TEXT DEFAULT '01-01',
    logo TEXT,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for companies
ALTER TABLE public.ac_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their companies" 
ON public.ac_companies 
FOR ALL USING (auth.uid() = user_id);

-- Create Currencies Table
CREATE TABLE public.ac_currencies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    exchange_rate NUMERIC(15,6) DEFAULT 1.000000,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for currencies
ALTER TABLE public.ac_currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Currencies are public" 
ON public.ac_currencies 
FOR SELECT USING (true);

-- Create Accounts Table (Chart of Accounts)
CREATE TABLE public.ac_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.ac_companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.ac_accounts(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    category TEXT,
    opening_balance NUMERIC(15,2) DEFAULT 0,
    current_balance NUMERIC(15,2) DEFAULT 0,
    currency_code TEXT DEFAULT 'USD',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (company_id, code)
);

-- Enable RLS for accounts
ALTER TABLE public.ac_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their accounts" 
ON public.ac_accounts 
FOR ALL USING (auth.uid() = user_id);

-- Create Customers Table
CREATE TABLE public.ac_customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.ac_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    currency_code TEXT DEFAULT 'USD',
    outstanding_balance NUMERIC(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for customers
ALTER TABLE public.ac_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their customers" 
ON public.ac_customers 
FOR ALL USING (auth.uid() = user_id);

-- Create Vendors Table
CREATE TABLE public.ac_vendors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.ac_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    currency_code TEXT DEFAULT 'USD',
    outstanding_balance NUMERIC(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for vendors
ALTER TABLE public.ac_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their vendors" 
ON public.ac_vendors 
FOR ALL USING (auth.uid() = user_id);

-- Create Tax Rates Table
CREATE TABLE public.ac_tax_rates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.ac_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rate NUMERIC(5,2) NOT NULL,
    type TEXT CHECK (type IN ('inclusive', 'exclusive')) DEFAULT 'exclusive',
    is_compound BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for tax rates
ALTER TABLE public.ac_tax_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tax rates" 
ON public.ac_tax_rates 
FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_ac_companies_updated_at BEFORE UPDATE ON public.ac_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ac_currencies_updated_at BEFORE UPDATE ON public.ac_currencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ac_accounts_updated_at BEFORE UPDATE ON public.ac_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ac_customers_updated_at BEFORE UPDATE ON public.ac_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ac_vendors_updated_at BEFORE UPDATE ON public.ac_vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ac_tax_rates_updated_at BEFORE UPDATE ON public.ac_tax_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();