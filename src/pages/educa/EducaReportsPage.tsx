import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, GraduationCap, Users, Building2, FileText, Plane, DollarSign, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function EducaReportsPage() {
  const { user } = useAuth();

  const { data: students } = useQuery({ queryKey: ["educa_rpt_students"], queryFn: async () => { const { data } = await supabase.from("educa_students").select("preferred_country, source, status, created_at"); return data ?? []; }, enabled: !!user });
  const { data: applications } = useQuery({ queryKey: ["educa_rpt_apps"], queryFn: async () => { const { data } = await supabase.from("educa_applications").select("status, tuition_fee, scholarship_amount, created_at"); return data ?? []; }, enabled: !!user });
  const { data: agents } = useQuery({ queryKey: ["educa_rpt_agents"], queryFn: async () => { const { data } = await supabase.from("educa_agents").select("country, status, total_students, total_commission"); return data ?? []; }, enabled: !!user });
  const { data: commissions } = useQuery({ queryKey: ["educa_rpt_comm"], queryFn: async () => { const { data } = await supabase.from("educa_commissions").select("amount, status, type, created_at"); return data ?? []; }, enabled: !!user });
  const { data: visas } = useQuery({ queryKey: ["educa_rpt_visa"], queryFn: async () => { const { data } = await supabase.from("educa_visa").select("status, country"); return data ?? []; }, enabled: !!user });
  const { data: leads } = useQuery({ queryKey: ["educa_rpt_leads"], queryFn: async () => { const { data } = await supabase.from("educa_leads").select("status, source"); return data ?? []; }, enabled: !!user });

  const countryData = Object.entries((students ?? []).reduce((acc: Record<string, number>, s) => { const c = s.preferred_country || "Other"; acc[c] = (acc[c] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const appStatusData = ["new", "submitted", "processing", "offer_received", "accepted", "rejected", "visa_processing", "enrolled"]
    .map(s => ({ name: s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), value: (applications ?? []).filter(a => a.status === s).length })).filter(d => d.value > 0);

  const visaData = ["not_started", "submitted", "approved", "rejected"]
    .map(s => ({ name: s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), value: (visas ?? []).filter(v => v.status === s).length })).filter(d => d.value > 0);

  const leadSourceData = Object.entries((leads ?? []).reduce((acc: Record<string, number>, l) => { const s = l.source || "Other"; acc[s] = (acc[s] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), value }));

  const totalRevenue = (commissions ?? []).filter(c => c.status === "paid").reduce((s, c) => s + (c.amount || 0), 0);
  const totalPending = (commissions ?? []).filter(c => c.status === "pending").reduce((s, c) => s + (c.amount || 0), 0);
  const visaRate = (visas ?? []).length > 0 ? Math.round(((visas ?? []).filter(v => v.status === "approved").length / (visas ?? []).length) * 100) : 0;
  const conversionRate = (leads ?? []).length > 0 ? Math.round(((leads ?? []).filter(l => l.status === "converted").length / (leads ?? []).length) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" /> Reports & Analytics</h1><p className="text-muted-foreground">EDUCA performance metrics</p></div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Students</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{(students ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Revenue (Paid)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Visa Success Rate</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{visaRate}%</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lead Conversion</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{conversionRate}%</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle className="text-sm">Students by Destination</CardTitle></CardHeader><CardContent className="h-64">
            {countryData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={countryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-sm">Application Pipeline</CardTitle></CardHeader><CardContent className="h-64">
            {appStatusData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={appStatusData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[0,4,4,0]} /></BarChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-sm">Visa Status</CardTitle></CardHeader><CardContent className="h-64">
            {visaData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={visaData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{visaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-sm">Lead Sources</CardTitle></CardHeader><CardContent className="h-64">
            {leadSourceData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={leadSourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{leadSourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
