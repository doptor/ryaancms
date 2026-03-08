import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Users, BarChart3, ArrowRight, PhoneCall, PhoneIncoming, PhoneOutgoing, Bot, Megaphone, UserCog, FileText, Settings, Headphones, ClipboardList, GitBranch, Bell } from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "Communication",
    items: [
      { label: "Contacts", path: "/dashboard/comm/contacts", icon: Users, color: "text-blue-600" },
      { label: "Voice Calls", path: "/dashboard/comm/calls", icon: Phone, color: "text-green-600" },
      { label: "WhatsApp Chats", path: "/dashboard/comm/whatsapp", icon: MessageSquare, color: "text-emerald-600" },
      { label: "Call Center", path: "/dashboard/comm/call-center", icon: Headphones, color: "text-purple-600" },
      { label: "Notifications", path: "/dashboard/comm/notifications", icon: Bell, color: "text-rose-600" },
    ],
  },
  {
    title: "Automation",
    items: [
      { label: "Campaigns", path: "/dashboard/comm/campaigns", icon: Megaphone, color: "text-orange-600" },
      { label: "AI Scripts", path: "/dashboard/comm/scripts", icon: Bot, color: "text-cyan-600" },
      { label: "IVR Builder", path: "/dashboard/comm/ivr", icon: GitBranch, color: "text-teal-600" },
      { label: "Agents", path: "/dashboard/comm/agents", icon: UserCog, color: "text-indigo-600" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Reports", path: "/dashboard/comm/reports", icon: BarChart3, color: "text-amber-600" },
      { label: "Settings", path: "/dashboard/comm/settings", icon: Settings, color: "text-slate-600" },
    ],
  },
];

export default function CommDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: contacts } = useQuery({ queryKey: ["comm_contacts_count"], queryFn: async () => { const { count } = await supabase.from("comm_contacts").select("*", { count: "exact", head: true }); return count ?? 0; }, enabled: !!user });
  const { data: calls } = useQuery({ queryKey: ["comm_calls_stats"], queryFn: async () => { const { data } = await supabase.from("comm_calls").select("direction, status, duration").order("created_at", { ascending: false }).limit(500); return data ?? []; }, enabled: !!user });
  const { data: messages } = useQuery({ queryKey: ["comm_wa_count"], queryFn: async () => { const { count } = await supabase.from("comm_whatsapp_messages").select("*", { count: "exact", head: true }); return count ?? 0; }, enabled: !!user });
  const { data: campaigns } = useQuery({ queryKey: ["comm_camp_active"], queryFn: async () => { const { data } = await supabase.from("comm_campaigns").select("status"); return data ?? []; }, enabled: !!user });
  const { data: agents } = useQuery({ queryKey: ["comm_agents_online"], queryFn: async () => { const { data } = await supabase.from("comm_agents").select("status"); return data ?? []; }, enabled: !!user });

  const totalCalls = (calls ?? []).length;
  const inbound = (calls ?? []).filter(c => c.direction === "inbound").length;
  const outbound = (calls ?? []).filter(c => c.direction === "outbound").length;
  const totalDuration = (calls ?? []).reduce((s, c) => s + (c.duration ?? 0), 0);
  const activeCampaigns = (campaigns ?? []).filter(c => c.status === "active").length;
  const onlineAgents = (agents ?? []).filter(a => a.status === "online").length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Phone className="w-6 h-6 text-primary" /> AI Communication Hub</h1>
          <p className="text-muted-foreground">Voice calls, WhatsApp automation & AI assistant</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5" />Contacts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{contacts ?? 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5" />Total Calls</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalCalls}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><PhoneIncoming className="w-3.5 h-3.5" />Inbound</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{inbound}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><PhoneOutgoing className="w-3.5 h-3.5" />Outbound</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{outbound}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />Messages</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{messages ?? 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Megaphone className="w-3.5 h-3.5" />Active Campaigns</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{activeCampaigns}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 text-center"><PhoneCall className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-sm text-muted-foreground">Total Call Duration</div><div className="text-xl font-bold">{Math.floor(totalDuration / 60)}m {totalDuration % 60}s</div></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><UserCog className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-sm text-muted-foreground">Agents Online</div><div className="text-xl font-bold text-green-600">{onlineAgents} / {(agents ?? []).length}</div></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><Bot className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-sm text-muted-foreground">AI Campaigns</div><div className="text-xl font-bold">{(campaigns ?? []).length}</div></CardContent></Card>
        </div>

        {NAV_SECTIONS.map(section => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {section.items.map(item => (
                <Card key={item.path} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(item.path)}>
                  <CardContent className="pt-4 flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
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
