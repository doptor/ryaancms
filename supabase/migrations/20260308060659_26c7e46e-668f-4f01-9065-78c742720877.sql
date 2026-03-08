
-- CRM Email logs for tracking communication history
CREATE TABLE public.crm_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  direction TEXT NOT NULL DEFAULT 'outbound',
  subject TEXT NOT NULL,
  body TEXT,
  to_email TEXT,
  from_email TEXT,
  status TEXT DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own crm emails" ON public.crm_emails FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_crm_emails_contact ON public.crm_emails(contact_id);
CREATE INDEX idx_crm_emails_deal ON public.crm_emails(deal_id);
