import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BarChart3, TrendingUp, Users, Target, Megaphone, Ticket } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#ec4899", "#6366f1"];

export default function CRMReportsPage() {
  const { user } = useAuth();

  const { data: leads } = useQuery({
    queryKey: ["crm-rpt-leads"],
    queryFn: async () => { const { data } = await supabase.from("crm_leads").select("status, source, created_at"); return data ?? []; },
    enabled: !!user,
  });

  const { data: deals } = useQuery({
    queryKey: ["crm-rpt-deals"],
    queryFn: async () => { const { data } = await supabase.from("crm_deals").select("value, status, created_at, probability"); return data ?? []; },
    enabled: !!user,
  });

  const { data: campaigns } = useQuery({
    queryKey: ["crm-rpt-campaigns"],
    queryFn: async () => { const { data } = await supabase.from("crm_campaigns").select("budget, spent, leads_generated, conversions, status, name"); return data ?? []; },
    enabled: !!user,
  });

  const { data: tickets } = useQuery({
    queryKey: ["crm-rpt-tickets"],
    queryFn: async () => { const { data } = await supabase.from("crm_tickets").select("status, priority, created_at, resolved_at"); return data ?? []; },
    enabled: !!user,
  });

  const totalLeads = (leads ?? []).length;
  const wonLeads = (leads ?? []).filter(l => l.status === "won").length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";

  const wonDeals = (deals ?? []).filter(d => d.status === "won");
  const totalRevenue = wonDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
  const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

  const totalSpent = (campaigns ?? []).reduce((s, c) => s + Number(c.spent ?? 0), 0);
  const totalCampaignLeads = (campaigns ?? []).reduce((s, c) => s + (c.leads_generated ?? 0), 0);
  const costPerLead = totalCampaignLeads > 0 ? totalSpent / totalCampaignLeads : 0;

  const resolvedTickets = (tickets ?? []).filter(t => t.status === "resolved" || t.status === "closed").length;
  const resolutionRate = (tickets ?? []).length > 0 ? ((resolvedTickets / (tickets ?? []).length) * 100).toFixed(1) : "0";

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  // Lead sources pie
  const sourceData = Object.entries(
    (leads ?? []).reduce<Record<string, number>>((acc, l) => { acc[l.source || "other"] = (acc[l.source || "other"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Lead status breakdown
  const leadStatusData = Object.entries(
    (leads ?? []).reduce<Record<string, number>>((acc, l) => { acc[l.status || "new"] = (acc[l.status || "new"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Campaign performance
  const campaignData = (campaigns ?? []).map(c => ({ name: c.name?.slice(0, 15), budget: Number(c.budget ?? 0), spent: Number(c.spent ?? 0), leads: c.leads_generated ?? 0 }));

  // Monthly leads trend
  const monthlyLeads = (() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[d.toLocaleDateString("en-US", { month: "short" })] = 0;
    }
    (leads ?? []).forEach(l => {
      const key = new Date(l.created_at).toLocaleDateString("en-US", { month: "short" });
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  })();

  // Ticket priority breakdown
  const ticketPriorityData = Object.entries(
    (tickets ?? []).reduce<Record<string, number>>((acc, t) => { acc[t.priority || "medium"] = (acc[t.priority || "medium"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const metrics = [
    { title: "Lead Conversion Rate", value: `${conversionRate}%`, sub: `${wonLeads} of ${totalLeads}`, icon: Users, color: "text-blue-600" },
    { title: "Total Revenue", value: fmt(totalRevenue), sub: `${wonDeals.length} won deals`, icon: TrendingUp, color: "text-green-600" },
    { title: "Avg Deal Size", value: fmt(avgDealSize), sub: `${(deals ?? []).length} total`, icon: Target, color: "text-amber-600" },
    { title: "Cost per Lead", value: fmt(costPerLead), sub: `${totalCampaignLeads} leads`, icon: Megaphone, color: "text-pink-600" },
    { title: "Resolution Rate", value: `${resolutionRate}%`, sub: `${resolvedTickets} resolved`, icon: Ticket, color: "text-red-600" },
    { title: "Pipeline Value", value: fmt((deals ?? []).filter(d => d.status === "open").reduce((s, d) => s + Number(d.value ?? 0), 0)), sub: "Open deals", icon: BarChart3, color: "text-indigo-600" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" /> CRM Reports</h1>
          <p className="text-muted-foreground">Performance analytics & insights</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map(m => (
            <Card key={m.title}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium">{m.title}</CardTitle>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </CardHeader>
              <CardContent><div className="text-lg font-bold">{m.value}</div><p className="text-xs text-muted-foreground">{m.sub}</p></CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Monthly Leads Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyLeads}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Lead Sources</CardTitle></CardHeader>
            <CardContent>
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-12">No data</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Lead Status Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={leadStatusData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {leadStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Campaign Performance</CardTitle></CardHeader>
            <CardContent>
              {campaignData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={campaignData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="budget" fill="#3b82f6" name="Budget" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" fill="#f59e0b" name="Spent" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-12">No campaigns</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Ticket Priority Distribution</CardTitle></CardHeader>
            <CardContent>
              {ticketPriorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={ticketPriorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {ticketPriorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-12">No tickets</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
