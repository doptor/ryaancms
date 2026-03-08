
-- HR Performance Reviews
CREATE TABLE public.hr_review_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_review_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own review cycles" ON public.hr_review_cycles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.hr_performance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  reviewer_id UUID,
  cycle_id UUID REFERENCES public.hr_review_cycles(id) ON DELETE SET NULL,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_rating INTEGER DEFAULT 0,
  goals TEXT,
  achievements TEXT,
  areas_of_improvement TEXT,
  reviewer_comments TEXT,
  employee_comments TEXT,
  status TEXT DEFAULT 'draft',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own performance reviews" ON public.hr_performance_reviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Training & Development
CREATE TABLE public.hr_training_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trainer TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  max_participants INTEGER DEFAULT 20,
  cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'planned',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own training programs" ON public.hr_training_programs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.hr_training_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.hr_training_programs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled',
  completion_date DATE,
  score NUMERIC,
  certificate_url TEXT,
  feedback TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_training_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own training enrollments" ON public.hr_training_enrollments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Shift Scheduling
CREATE TABLE public.hr_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 60,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shifts" ON public.hr_shifts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.hr_shift_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.hr_shifts(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL,
  overtime_hours NUMERIC DEFAULT 0,
  swap_requested BOOLEAN DEFAULT false,
  swap_with_id UUID REFERENCES public.hr_employees(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'assigned',
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_shift_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shift assignments" ON public.hr_shift_assignments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Onboarding/Offboarding
CREATE TABLE public.hr_onboarding_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'onboarding',
  items JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_onboarding_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own onboarding templates" ON public.hr_onboarding_templates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.hr_onboarding_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.hr_onboarding_templates(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'onboarding',
  task_name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_onboarding_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own onboarding tasks" ON public.hr_onboarding_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
