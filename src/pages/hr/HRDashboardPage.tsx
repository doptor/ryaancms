import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Users, CalendarDays, DollarSign, Briefcase, ArrowRight, UserPlus, Clock, FileText, Calendar, Award, GraduationCap, CalendarRange, ClipboardList } from "lucide-react";
import { BarChart, Bar, PieChart as RPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const navSections = [
  {
    title: "People",
    items: [
      { label: "Employees", path: "/dashboard/hr/employees", icon: Users, color: "text-blue-600" },
      { label: "Departments", path: "/dashboard/hr/departments", icon: Briefcase, color: "text-purple-600" },
    ],
  },
  {
    title: "Time & Leave",
    items: [
      { label: "Attendance", path: "/dashboard/hr/attendance", icon: Clock, color: "text-green-600" },
      { label: "Leave Requests", path: "/dashboard/hr/leave", icon: CalendarDays, color: "text-orange-600" },
      { label: "Holidays", path: "/dashboard/hr/holidays", icon: Calendar, color: "text-pink-600" },
    ],
  },
  {
    title: "Compensation",
    items: [
      { label: "Payroll", path: "/dashboard/hr/payroll", icon: DollarSign, color: "text-emerald-600" },
    ],
  },
  {
    title: "Talent",
    items: [
      { label: "Job Postings", path: "/dashboard/hr/recruitment", icon: FileText, color: "text-cyan-600" },
      { label: "Applicants", path: "/dashboard/hr/applicants", icon: UserPlus, color: "text-indigo-600" },
    ],
  },
  {
    title: "Advanced",
    items: [
      { label: "Performance Reviews", path: "/dashboard/hr/performance", icon: Award, color: "text-amber-600" },
      { label: "Training", path: "/dashboard/hr/training", icon: GraduationCap, color: "text-teal-600" },
      { label: "Shift Scheduling", path: "/dashboard/hr/shifts", icon: CalendarRange, color: "text-violet-600" },
      { label: "Onboarding", path: "/dashboard/hr/onboarding", icon: ClipboardList, color: "text-rose-600" },
    ],
  },
];

export default function HRDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: employees } = useQuery({
    queryKey: ["hr_employees_dash"], queryFn: async () => { const { data } = await supabase.from("hr_employees").select("id, status, department_id, basic_salary, employment_type"); return data ?? []; }, enabled: !!user,
  });
  const { data: departments } = useQuery({
    queryKey: ["hr_departments_dash"], queryFn: async () => { const { data } = await supabase.from("hr_departments").select("id, name"); return data ?? []; }, enabled: !!user,
  });
  const { data: leaveReqs } = useQuery({
    queryKey: ["hr_leave_dash"], queryFn: async () => { const { data } = await supabase.from("hr_leave_requests").select("id, status"); return data ?? []; }, enabled: !!user,
  });
  const { data: jobs } = useQuery({
    queryKey: ["hr_jobs_dash"], queryFn: async () => { const { data } = await supabase.from("hr_job_postings").select("id, status"); return data ?? []; }, enabled: !!user,
  });

  const activeEmps = (employees ?? []).filter(e => e.status === "active").length;
  const totalSalary = (employees ?? []).filter(e => e.status === "active").reduce((s, e) => s + Number(e.basic_salary ?? 0), 0);
  const pendingLeave = (leaveReqs ?? []).filter(l => l.status === "pending").length;
  const openJobs = (jobs ?? []).filter(j => j.status === "open").length;

  // Dept distribution
  const deptData = (departments ?? []).map(d => ({
    name: d.name,
    value: (employees ?? []).filter(e => e.department_id === d.id && e.status === "active").length,
  })).filter(d => d.value > 0);

  // Employment type
  const typeData = Object.entries(
    (employees ?? []).filter(e => e.status === "active").reduce<Record<string, number>>((acc, e) => { acc[e.employment_type || "full_time"] = (acc[e.employment_type || "full_time"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> HR Dashboard</h1>
            <p className="text-muted-foreground">Human Resources management overview</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/hr/employees")}><UserPlus className="w-4 h-4 mr-2" />Add Employee</Button>
            <Button onClick={() => navigate("/dashboard/hr/payroll")}><DollarSign className="w-4 h-4 mr-2" />Run Payroll</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Active Employees</CardTitle><Users className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{activeEmps}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle><DollarSign className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${totalSalary.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Pending Leave</CardTitle><CalendarDays className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{pendingLeave}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Open Positions</CardTitle><Briefcase className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{openJobs}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Employees by Department</CardTitle></CardHeader>
            <CardContent>{deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RPieChart><Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{deptData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip /></RPieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground text-sm py-16">No data</p>}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Employment Type</CardTitle></CardHeader>
            <CardContent>{typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={typeData}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Employees" /></BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground text-sm py-16">No data</p>}</CardContent>
          </Card>
        </div>

        {navSections.map(section => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-foreground mb-3">{section.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {section.items.map(item => (
                <Card key={item.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(item.path)}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${item.color}`}><item.icon className="w-5 h-5" /></div>
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
