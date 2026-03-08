import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, Briefcase, Target, Phone, Mail, BarChart3,
  Ticket, Megaphone, ArrowRight, Plus, TrendingUp, DollarSign, CheckCircle,
  Columns3, Bot
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

export default function CRMDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: leadCount } = useQuery({
    queryKey: ["crm-dash-leads"],
    queryFn: async () => {
      const { count, error } = await supabase.from("crm_leads").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: newLeads } = useQuery({
    queryKey: ["crm-dash-new-leads"],
    queryFn: async () => {
      const { count, error } = await supabase.from("crm_leads").select("*", { count: "exact", head: true }).eq("status", "new");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: deals } = useQuery({
    queryKey: ["crm-dash-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_deals").select("value, status");
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

  const totalRevenue = (deals ?? []).filter(d => d.status === "won").reduce((s, d) => s + Number(d.value ?? 0), 0);
  const closedDeals = (deals ?? []).filter(d => d.status === "won").length;
  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              CRM Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Customer relationship management overview</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/crm/leads")}>
              <Plus className="w-4 h-4 mr-2" />New Lead
            </Button>
            <Button onClick={() => navigate("/dashboard/crm/deals")}>
              <Plus className="w-4 h-4 mr-2" />New Deal
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <UserPlus className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">{newLeads ?? 0} new</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Deals Closed</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{closedDeals}</div>
              <p className="text-xs text-muted-foreground">out of {(deals ?? []).length} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Sales Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{fmt(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Won deals value</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Ticket className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTickets ?? 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting resolution</p>
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
                  <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
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
