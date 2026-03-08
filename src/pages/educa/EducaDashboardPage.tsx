import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GraduationCap, Users, Building2, BookOpen, FileText, Plane, DollarSign, TrendingUp, UserPlus, Award, Loader2, ArrowRight, Globe, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  { label: "Leads", href: "/dashboard/educa/leads", icon: TrendingUp, desc: "Lead management" },
  { label: "Reports", href: "/dashboard/educa/reports", icon: BarChart3, desc: "Analytics & reports" },
];

export default function EducaDashboardPage() {
  const { user } = useAuth();

  const { data: students } = useQuery({ queryKey: ["educa_students_dash"], queryFn: async () => { const { data } = await supabase.from("educa_students").select("status, preferred_country, source"); return data ?? []; }, enabled: !!user });
  const { data: agents } = useQuery({ queryKey: ["educa_agents_dash"], queryFn: async () => { const { data } = await supabase.from("educa_agents").select("status, country, total_students, total_commission"); return data ?? []; }, enabled: !!user });
  const { data: applications } = useQuery({ queryKey: ["educa_apps_dash"], queryFn: async () => { const { data } = await supabase.from("educa_applications").select("status, intake, tuition_fee, scholarship_amount"); return data ?? []; }, enabled: !!user });
  const { data: universities } = useQuery({ queryKey: ["educa_unis_dash"], queryFn: async () => { const { data } = await supabase.from("educa_universities").select("country, partnership_status"); return data ?? []; }, enabled: !!user });
  const { data: commissions } = useQuery({ queryKey: ["educa_comm_dash"], queryFn: async () => { const { data } = await supabase.from("educa_commissions").select("amount, status, type"); return data ?? []; }, enabled: !!user });
  const { data: visas } = useQuery({ queryKey: ["educa_visa_dash"], queryFn: async () => { const { data } = await supabase.from("educa_visa").select("status"); return data ?? []; }, enabled: !!user });
  const { data: leads } = useQuery({ queryKey: ["educa_leads_dash"], queryFn: async () => { const { data } = await supabase.from("educa_leads").select("status, source"); return data ?? []; }, enabled: !!user });

  const totalStudents = (students ?? []).length;
  const activeAgents = (agents ?? []).filter(a => a.status === "approved").length;
  const totalApps = (applications ?? []).length;
  const totalUnis = (universities ?? []).length;
  const pendingCommissions = (commissions ?? []).filter(c => c.status === "pending").reduce((s, c) => s + (c.amount || 0), 0);
  const visaApproved = (visas ?? []).filter(v => v.status === "approved").length;
  const visaTotal = (visas ?? []).length;
  const newLeads = (leads ?? []).filter(l => l.status === "new").length;

  const appStatusData = ["new", "submitted", "processing", "offer_received", "accepted", "rejected", "visa_processing", "enrolled"]
    .map(s => ({ name: s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), value: (applications ?? []).filter(a => a.status === s).length }))
    .filter(d => d.value > 0);

  const countryData = Object.entries((students ?? []).reduce((acc: Record<string, number>, s) => { const c = s.preferred_country || "Other"; acc[c] = (acc[c] || 0) + 1; return acc; }, {}))
    .map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-7 h-7 text-primary" /> EDUCA Dashboard</h1>
          <p className="text-muted-foreground">Education Consultants ERP & CRM Platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />Students</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{totalStudents}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Applications</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{totalApps}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5" />Active Agents</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{activeAgents}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />Universities</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{totalUnis}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Plane className="w-3.5 h-3.5" />Visa Rate</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{visaTotal > 0 ? Math.round((visaApproved / visaTotal) * 100) : 0}%</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />Pending Commission</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">${pendingCommissions.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />New Leads</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-blue-600">{newLeads}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Globe className="w-3.5 h-3.5" />Countries</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{countryData.length}</div></CardContent></Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Application Status</CardTitle></CardHeader>
            <CardContent className="h-64">
              {appStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appStatusData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No applications yet</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Students by Country</CardTitle></CardHeader>
            <CardContent className="h-64">
              {countryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={countryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{countryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No student data yet</div>}
            </CardContent>
          </Card>
        </div>

        {/* Quick Nav */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Modules</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
