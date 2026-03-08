import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import {
  Users, UserPlus, Briefcase, Target, Phone, Mail, BarChart3,
  Ticket, Megaphone, ArrowRight, Plus, TrendingUp, DollarSign, CheckCircle,
  Columns3, Bot, Activity
} from "lucide-react";

const crmNav = [
  { label: "Leads", path: "/dashboard/crm/leads", icon: UserPlus, color: "text-blue-600", desc: "Manage prospects" },
  { label: "Contacts", path: "/dashboard/crm/contacts", icon: Users, color: "text-green-600", desc: "People directory" },
  { label: "Companies", path: "/dashboard/crm/companies", icon: Briefcase, color: "text-purple-600", desc: "Organizations" },
  { label: "Deals", path: "/dashboard/crm/deals", icon: Target, color: "text-amber-600", desc: "Deal list view" },
  { label: "Pipeline", path: "/dashboard/crm/pipeline", icon: Columns3, color: "text-cyan-600", desc: "Drag & drop Kanban" },
  { label: "Activities", path: "/dashboard/crm/activities", icon: Phone, color: "text-teal-600", desc: "Tasks & follow-ups" },
  { label: "Emails", path: "/dashboard/crm/emails", icon: Mail, color: "text-orange-600", desc: "Email tracking" },
  { label: "Campaigns", path: "/dashboard/crm/campaigns", icon: Megaphone, color: "text-pink-600", desc: "Marketing campaigns" },
  { label: "Tickets", path: "/dashboard/crm/tickets", icon: Ticket, color: "text-red-600", desc: "Customer support" },
  { label: "AI Assistant", path: "/dashboard/crm/ai-assistant", icon: Bot, color: "text-violet-600", desc: "AI sales insights" },
  { label: "Reports", path: "/dashboard/crm/reports", icon: BarChart3, color: "text-indigo-600", desc: "Analytics & insights" },
];

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

export default function CRMDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: leads } = useQuery({
    queryKey: ["crm-dash-leads-full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_leads").select("status, source, created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: deals } = useQuery({
    queryKey: ["crm-dash-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_deals").select("value, status, created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: openTickets } = useQuery({
    queryKey: ["crm-dash-tickets"],
    queryFn: async () => {
      const { count, error } = await supabase.from("crm_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: activitiesPending } = useQuery({
    queryKey: ["crm-dash-activities"],
    queryFn: async () => {
      const { count, error } = await supabase.from("crm_activities").select("*", { count: "exact", head: true }).eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const totalLeads = (leads ?? []).length;
  const newLeads = (leads ?? []).filter(l => l.status === "new").length;
  const totalRevenue = (deals ?? []).filter(d => d.status === "won").reduce((s, d) => s + Number(d.value ?? 0), 0);
  const closedDeals = (deals ?? []).filter(d => d.status === "won").length;
  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  // Lead source chart data
  const sourceData = Object.entries(
    (leads ?? []).reduce<Record<string, number>>((acc, l) => { acc[l.source || "other"] = (acc[l.source || "other"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Deal status chart data
  const dealStatusData = Object.entries(
    (deals ?? []).reduce<Record<string, number>>((acc, d) => { acc[d.status || "open"] = (acc[d.status || "open"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Monthly revenue (last 6 months)
  const monthlyData = (() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = 0;
    }
    (deals ?? []).filter(d => d.status === "won").forEach(d => {
      const dt = new Date(d.created_at);
      const key = dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (key in months) months[key] += Number(d.value ?? 0);
    });
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
  })();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" /> CRM Dashboard
            </h1>
            <p className="text-muted-foreground">Customer relationship management overview</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/crm/leads")}><Plus className="w-4 h-4 mr-2" />New Lead</Button>
            <Button onClick={() => navigate("/dashboard/crm/deals")}><Plus className="w-4 h-4 mr-2" />New Deal</Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Total Leads</CardTitle>
              <UserPlus className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{totalLeads}</div><p className="text-xs text-muted-foreground">{newLeads} new</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Deals Closed</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold text-green-600">{closedDeals}</div><p className="text-xs text-muted-foreground">of {(deals ?? []).length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold text-green-600">{fmt(totalRevenue)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Open Tickets</CardTitle>
              <Ticket className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{openTickets ?? 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Pending Tasks</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{activitiesPending ?? 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Conversion</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{totalLeads > 0 ? ((closedDeals / totalLeads) * 100).toFixed(1) : 0}%</div></CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Monthly Revenue</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Lead Sources</CardTitle></CardHeader>
            <CardContent>
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sourceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground text-sm py-8">No lead data</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Deal Status</CardTitle></CardHeader>
            <CardContent>
              {dealStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dealStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                      {dealStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground text-sm py-8">No deals data</p>}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <h2 className="text-lg font-semibold text-foreground">CRM Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {crmNav.map((item) => (
            <Card key={item.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(item.path)}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${item.color}`}><item.icon className="w-5 h-5" /></div>
                  <div>
                    <span className="font-medium text-foreground">{item.label}</span>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
