import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GraduationCap, Users, Building2, BookOpen, FileText, Plane, DollarSign, TrendingUp, UserPlus, Award, Globe, BarChart3, FolderOpen, Settings, ArrowRight, Clock, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays, isAfter } from "date-fns";
import EducaGlobalSearch from "@/components/educa/EducaGlobalSearch";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const navSections = [
  { label: "Students", href: "/dashboard/educa/students", icon: GraduationCap, desc: "Manage student profiles" },
  { label: "Agents", href: "/dashboard/educa/agents", icon: Users, desc: "Agent network" },
  { label: "Counsellors", href: "/dashboard/educa/counsellors", icon: UserPlus, desc: "Counsellor team" },
  { label: "Universities", href: "/dashboard/educa/universities", icon: Building2, desc: "Partner institutions" },
  { label: "Courses", href: "/dashboard/educa/courses", icon: BookOpen, desc: "Course catalog" },
  { label: "Applications", href: "/dashboard/educa/applications", icon: FileText, desc: "Track applications" },
  { label: "Visa", href: "/dashboard/educa/visa", icon: Plane, desc: "Visa processing" },
  { label: "Commissions", href: "/dashboard/educa/commissions", icon: DollarSign, desc: "Commission tracking" },
  { label: "Scholarships", href: "/dashboard/educa/scholarships", icon: Award, desc: "Scholarship programs" },
  { label: "Documents", href: "/dashboard/educa/documents", icon: FolderOpen, desc: "Document management" },
  { label: "Leads", href: "/dashboard/educa/leads", icon: TrendingUp, desc: "Lead management" },
  { label: "Reports", href: "/dashboard/educa/reports", icon: BarChart3, desc: "Analytics & reports" },
  { label: "Settings", href: "/dashboard/educa/settings", icon: Settings, desc: "Platform settings" },
];

export default function EducaDashboardPage() {
  const { user } = useAuth();

  const { data: students } = useQuery({ queryKey: ["educa_students_dash"], queryFn: async () => { const { data } = await supabase.from("educa_students").select("status, preferred_country, source, created_at"); return data ?? []; }, enabled: !!user });
  const { data: agents } = useQuery({ queryKey: ["educa_agents_dash"], queryFn: async () => { const { data } = await supabase.from("educa_agents").select("status, country, total_students, total_commission"); return data ?? []; }, enabled: !!user });
  const { data: applications } = useQuery({ queryKey: ["educa_apps_dash"], queryFn: async () => { const { data } = await supabase.from("educa_applications").select("status, intake, tuition_fee, scholarship_amount, created_at, application_date"); return data ?? []; }, enabled: !!user });
  const { data: universities } = useQuery({ queryKey: ["educa_unis_dash"], queryFn: async () => { const { data } = await supabase.from("educa_universities").select("country, partnership_status"); return data ?? []; }, enabled: !!user });
  const { data: commissions } = useQuery({ queryKey: ["educa_comm_dash"], queryFn: async () => { const { data } = await supabase.from("educa_commissions").select("amount, status, type, created_at"); return data ?? []; }, enabled: !!user });
  const { data: visas } = useQuery({ queryKey: ["educa_visa_dash"], queryFn: async () => { const { data } = await supabase.from("educa_visa").select("status, interview_date"); return data ?? []; }, enabled: !!user });
  const { data: leads } = useQuery({ queryKey: ["educa_leads_dash"], queryFn: async () => { const { data } = await supabase.from("educa_leads").select("status, source, created_at"); return data ?? []; }, enabled: !!user });
  const { data: documents } = useQuery({ queryKey: ["educa_docs_dash"], queryFn: async () => { const { data } = await supabase.from("educa_documents").select("status"); return data ?? []; }, enabled: !!user });

  const totalStudents = (students ?? []).length;
  const activeAgents = (agents ?? []).filter(a => a.status === "approved").length;
  const totalApps = (applications ?? []).length;
  const totalUnis = (universities ?? []).length;
  const pendingCommissions = (commissions ?? []).filter(c => c.status === "pending").reduce((s, c) => s + (c.amount || 0), 0);
  const paidCommissions = (commissions ?? []).filter(c => c.status === "paid").reduce((s, c) => s + (c.amount || 0), 0);
  const visaApproved = (visas ?? []).filter(v => v.status === "approved").length;
  const visaTotal = (visas ?? []).length;
  const newLeads = (leads ?? []).filter(l => l.status === "new").length;
  const totalDocs = (documents ?? []).length;
  const pendingDocs = (documents ?? []).filter(d => d.status === "pending").length;

  // Pipeline data
  const pipelineStatuses = ["new", "submitted", "processing", "offer_received", "accepted", "visa_processing", "enrolled"];
  const pipelineData = pipelineStatuses.map(s => ({
    name: s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value: (applications ?? []).filter(a => a.status === s).length,
  }));

  // Country distribution
  const countryData = Object.entries((students ?? []).reduce((acc: Record<string, number>, s) => { const c = s.preferred_country || "Other"; acc[c] = (acc[c] || 0) + 1; return acc; }, {}))
    .map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  // Monthly trend (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = subDays(new Date(), (5 - i) * 30);
    const month = format(d, "MMM");
    const start = subDays(d, 30);
    return {
      month,
      students: (students ?? []).filter(s => { const cd = new Date(s.created_at); return cd >= start && cd <= d; }).length,
      applications: (applications ?? []).filter(a => { const cd = new Date(a.created_at); return cd >= start && cd <= d; }).length,
      leads: (leads ?? []).filter(l => { const cd = new Date(l.created_at); return cd >= start && cd <= d; }).length,
    };
  });

  // Upcoming visa interviews
  const upcomingInterviews = (visas ?? []).filter(v => v.interview_date && isAfter(new Date(v.interview_date), new Date())).length;

  // Quick alerts
  const alerts = [];
  if (pendingDocs > 0) alerts.push({ text: `${pendingDocs} documents pending review`, icon: FolderOpen, color: "text-orange-500" });
  if (newLeads > 0) alerts.push({ text: `${newLeads} new leads to follow up`, icon: TrendingUp, color: "text-blue-500" });
  if (pendingCommissions > 0) alerts.push({ text: `$${pendingCommissions.toLocaleString()} in pending commissions`, icon: DollarSign, color: "text-amber-500" });
  if (upcomingInterviews > 0) alerts.push({ text: `${upcomingInterviews} upcoming visa interviews`, icon: Plane, color: "text-violet-500" });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-7 h-7 text-primary" /> EDUCA Dashboard</h1>
            <p className="text-muted-foreground">Education Consultants ERP & CRM Platform</p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/educa/students"><Button variant="outline" size="sm"><UserPlus className="w-4 h-4 mr-1" />Add Student</Button></Link>
            <Link to="/dashboard/educa/applications"><Button size="sm"><FileText className="w-4 h-4 mr-1" />New Application</Button></Link>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-orange-500" /><span className="font-medium text-sm">Action Required</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm"><a.icon className={`w-4 h-4 ${a.color}`} /><span>{a.text}</span></div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalStudents}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Applications</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalApps}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5" />Active Agents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{activeAgents}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />Universities</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalUnis}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Plane className="w-3.5 h-3.5" />Visa Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{visaTotal > 0 ? Math.round((visaApproved / visaTotal) * 100) : 0}%</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />Pending Commission</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-orange-600">${pendingCommissions.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Paid Commission</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-green-600">${paidCommissions.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />New Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{newLeads}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="w-3.5 h-3.5" />Countries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{countryData.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><FolderOpen className="w-3.5 h-3.5" />Documents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalDocs}</div></CardContent></Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Pipeline */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm">Application Pipeline</CardTitle></CardHeader>
            <CardContent className="h-64">
              {pipelineData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No applications yet</div>}
            </CardContent>
          </Card>

          {/* Country Pie */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Students by Destination</CardTitle></CardHeader>
            <CardContent className="h-64">
              {countryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={countryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 10 }}>{countryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Monthly Activity Trend</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} name="Students" />
                <Line type="monotone" dataKey="applications" stroke="#10b981" strokeWidth={2} name="Applications" />
                <Line type="monotone" dataKey="leads" stroke="#f59e0b" strokeWidth={2} name="Leads" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Nav */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Modules</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {navSections.map(s => (
              <Link key={s.href} to={s.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <s.icon className="w-6 h-6 text-primary" />
                    <div className="font-medium text-sm">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
