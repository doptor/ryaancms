
-- HR Departments
CREATE TABLE public.hr_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  head_id UUID,
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own departments" ON public.hr_departments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Employees
CREATE TABLE public.hr_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT DEFAULT 'male',
  department_id UUID REFERENCES public.hr_departments(id) ON DELETE SET NULL,
  designation TEXT,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  termination_date DATE,
  employment_type TEXT DEFAULT 'full_time',
  basic_salary NUMERIC DEFAULT 0,
  bank_name TEXT,
  bank_account TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own employees" ON public.hr_employees FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Attendance
CREATE TABLE public.hr_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'present',
  notes TEXT,
  hours_worked NUMERIC DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own attendance" ON public.hr_attendance FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Leave Types
CREATE TABLE public.hr_leave_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  days_allowed INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_leave_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own leave types" ON public.hr_leave_types FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Leave Requests
CREATE TABLE public.hr_leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES public.hr_leave_types(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own leave requests" ON public.hr_leave_requests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Holidays
CREATE TABLE public.hr_holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own holidays" ON public.hr_holidays FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Payroll
CREATE TABLE public.hr_payroll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  pay_period TEXT NOT NULL,
  pay_date DATE NOT NULL DEFAULT CURRENT_DATE,
  basic_salary NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  overtime NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  net_salary NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  synced_to_accounting BOOLEAN DEFAULT false,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own payroll" ON public.hr_payroll FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Job Postings
CREATE TABLE public.hr_job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.hr_departments(id) ON DELETE SET NULL,
  description TEXT,
  requirements TEXT,
  employment_type TEXT DEFAULT 'full_time',
  salary_min NUMERIC,
  salary_max NUMERIC,
  location TEXT,
  positions INTEGER DEFAULT 1,
  deadline DATE,
  status TEXT DEFAULT 'open',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own job postings" ON public.hr_job_postings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Applicants
CREATE TABLE public.hr_applicants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.hr_job_postings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  experience_years INTEGER DEFAULT 0,
  current_salary NUMERIC,
  expected_salary NUMERIC,
  status TEXT DEFAULT 'applied',
  interview_date TIMESTAMP WITH TIME ZONE,
  interview_notes TEXT,
  rating INTEGER DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own applicants" ON public.hr_applicants FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
