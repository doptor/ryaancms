
-- EDUCA Plugin Tables

-- Students
CREATE TABLE public.educa_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dob DATE,
  nationality TEXT,
  passport_number TEXT,
  education_level TEXT DEFAULT 'bachelors',
  ielts_score NUMERIC,
  toefl_score NUMERIC,
  pte_score NUMERIC,
  preferred_country TEXT,
  preferred_intake TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'direct',
  agent_id UUID,
  counsellor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa students" ON public.educa_students FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Agents
CREATE TABLE public.educa_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  commission_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  contract_start DATE,
  contract_end DATE,
  total_students INTEGER DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa agents" ON public.educa_agents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Counsellors
CREATE TABLE public.educa_counsellors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialization TEXT,
  assigned_students INTEGER DEFAULT 0,
  max_students INTEGER DEFAULT 50,
  status TEXT DEFAULT 'active',
  performance_score NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_counsellors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa counsellors" ON public.educa_counsellors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Universities
CREATE TABLE public.educa_universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  country TEXT,
  city TEXT,
  website TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  commission_rate NUMERIC DEFAULT 0,
  ranking INTEGER,
  type TEXT DEFAULT 'public',
  partnership_status TEXT DEFAULT 'active',
  notes TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa universities" ON public.educa_universities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Courses
CREATE TABLE public.educa_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  university_id UUID REFERENCES public.educa_universities(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  course_code TEXT,
  level TEXT DEFAULT 'bachelors',
  duration TEXT,
  tuition_fee NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  intake TEXT,
  application_deadline DATE,
  entry_requirements TEXT,
  ielts_requirement NUMERIC,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa courses" ON public.educa_courses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Applications
CREATE TABLE public.educa_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  student_id UUID REFERENCES public.educa_students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.educa_courses(id) ON DELETE SET NULL,
  university_id UUID REFERENCES public.educa_universities(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.educa_agents(id) ON DELETE SET NULL,
  counsellor_id UUID REFERENCES public.educa_counsellors(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new',
  application_date DATE DEFAULT CURRENT_DATE,
  offer_letter_url TEXT,
  offer_received_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_reason TEXT,
  intake TEXT,
  tuition_fee NUMERIC DEFAULT 0,
  scholarship_amount NUMERIC DEFAULT 0,
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa applications" ON public.educa_applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Visa Applications
CREATE TABLE public.educa_visa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  student_id UUID REFERENCES public.educa_students(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.educa_applications(id) ON DELETE SET NULL,
  country TEXT,
  visa_type TEXT DEFAULT 'student',
  status TEXT DEFAULT 'not_started',
  submission_date DATE,
  interview_date TIMESTAMPTZ,
  decision_date DATE,
  expiry_date DATE,
  reference_number TEXT,
  notes TEXT,
  documents_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_visa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa visa" ON public.educa_visa FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Commissions
CREATE TABLE public.educa_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  application_id UUID REFERENCES public.educa_applications(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.educa_students(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.educa_agents(id) ON DELETE SET NULL,
  university_id UUID REFERENCES public.educa_universities(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'university_to_consultancy',
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  invoice_number TEXT,
  payment_date DATE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa commissions" ON public.educa_commissions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Leads
CREATE TABLE public.educa_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  nationality TEXT,
  preferred_country TEXT,
  preferred_level TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new',
  score INTEGER DEFAULT 0,
  assigned_to UUID,
  notes TEXT,
  converted_student_id UUID,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa leads" ON public.educa_leads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Scholarships
CREATE TABLE public.educa_scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  university_id UUID REFERENCES public.educa_universities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  type TEXT DEFAULT 'merit',
  eligibility TEXT,
  deadline DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa scholarships" ON public.educa_scholarships FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Documents
CREATE TABLE public.educa_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  student_id UUID REFERENCES public.educa_students(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.educa_applications(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'other',
  file_url TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'uploaded',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educa_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own educa documents" ON public.educa_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
