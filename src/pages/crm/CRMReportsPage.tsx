import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Target, Megaphone, Ticket } from "lucide-react";

export default function CRMReportsPage() {
  const { user } = useAuth();

  const { data: leads } = useQuery({
    queryKey: ["crm-rpt-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_leads").select("status, source, created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: deals } = useQuery({
    queryKey: ["crm-rpt-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_deals").select("value, status, created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: campaigns } = useQuery({
    queryKey: ["crm-rpt-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_campaigns").select("budget, spent, leads_generated, conversions, status");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: tickets } = useQuery({
    queryKey: ["crm-rpt-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_tickets").select("status, priority, created_at, resolved_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const totalLeads = (leads ?? []).length;
  const wonLeads = (leads ?? []).filter((l) => l.status === "won").length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";

  const totalDeals = (deals ?? []).length;
  const wonDeals = (deals ?? []).filter((d) => d.status === "won");
  const totalRevenue = wonDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
  const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

  const totalBudget = (campaigns ?? []).reduce((s, c) => s + Number(c.budget ?? 0), 0);
  const totalSpent = (campaigns ?? []).reduce((s, c) => s + Number(c.spent ?? 0), 0);
  const totalCampaignLeads = (campaigns ?? []).reduce((s, c) => s + (c.leads_generated ?? 0), 0);
  const costPerLead = totalCampaignLeads > 0 ? totalSpent / totalCampaignLeads : 0;

  const resolvedTickets = (tickets ?? []).filter((t) => t.status === "resolved" || t.status === "closed").length;
  const resolutionRate = (tickets ?? []).length > 0 ? ((resolvedTickets / (tickets ?? []).length) * 100).toFixed(1) : "0";

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  const metrics = [
    { title: "Lead Conversion Rate", value: `${conversionRate}%`, sub: `${wonLeads} of ${totalLeads} leads`, icon: Users, color: "text-blue-600" },
    { title: "Total Sales Revenue", value: fmt(totalRevenue), sub: `${wonDeals.length} won deals`, icon: TrendingUp, color: "text-green-600" },
    { title: "Average Deal Size", value: fmt(avgDealSize), sub: `${totalDeals} total deals`, icon: Target, color: "text-amber-600" },
    { title: "Campaign ROI", value: fmt(totalSpent), sub: `Budget: ${fmt(totalBudget)}`, icon: Megaphone, color: "text-pink-600" },
    { title: "Cost per Lead", value: fmt(costPerLead), sub: `${totalCampaignLeads} campaign leads`, icon: BarChart3, color: "text-indigo-600" },
    { title: "Ticket Resolution Rate", value: `${resolutionRate}%`, sub: `${resolvedTickets} of ${(tickets ?? []).length} resolved`, icon: Ticket, color: "text-red-600" },
  ];

  // Lead sources breakdown
  const sourceBreakdown = (leads ?? []).reduce<Record<string, number>>((acc, l) => {
    const src = l.source || "other";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" /> CRM Reports</h1>
          <p className="text-muted-foreground">Performance analytics & insights</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((m) => (
            <Card key={m.title}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">{m.title}</CardTitle>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{m.value}</div>
                <p className="text-xs text-muted-foreground">{m.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lead Sources */}
        <Card>
          <CardHeader><CardTitle>Lead Sources Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1]).map(([source, count]) => {
                const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                return (
                  <div key={source} className="flex items-center gap-3">
                    <span className="capitalize w-24 text-sm font-medium text-foreground">{source}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                );
              })}
              {Object.keys(sourceBreakdown).length === 0 && (
                <p className="text-center text-muted-foreground">No lead data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
