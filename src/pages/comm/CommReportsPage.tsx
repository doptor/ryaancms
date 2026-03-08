import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Phone, MessageSquare, Megaphone, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function CommReportsPage() {
  const { user } = useAuth();

  const { data: calls } = useQuery({ queryKey: ["comm_calls_rpt"], queryFn: async () => { const { data } = await supabase.from("comm_calls").select("direction, status, call_type, duration, created_at").order("created_at", { ascending: false }).limit(500); return data ?? []; }, enabled: !!user });
  const { data: messages } = useQuery({ queryKey: ["comm_wa_rpt"], queryFn: async () => { const { data } = await supabase.from("comm_whatsapp_messages").select("direction, status, is_bot_response, created_at").limit(500); return data ?? []; }, enabled: !!user });
  const { data: campaigns } = useQuery({ queryKey: ["comm_camp_rpt"], queryFn: async () => { const { data } = await supabase.from("comm_campaigns").select("type, status, total_contacts, contacted, successful, failed"); return data ?? []; }, enabled: !!user });

  const totalCalls = (calls ?? []).length;
  const completedCalls = (calls ?? []).filter(c => c.status === "completed").length;
  const failedCalls = (calls ?? []).filter(c => c.status === "failed" || c.status === "no_answer").length;
  const aiCalls = (calls ?? []).filter(c => c.call_type === "ai").length;
  const totalDuration = (calls ?? []).reduce((s, c) => s + (c.duration ?? 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  const totalMsgs = (messages ?? []).length;
  const botMsgs = (messages ?? []).filter(m => m.is_bot_response).length;
  const deliveredMsgs = (messages ?? []).filter(m => m.status === "delivered" || m.status === "read").length;

  const callStatusData = [
    { name: "Completed", value: completedCalls, color: "#10b981" },
    { name: "Failed", value: failedCalls, color: "#ef4444" },
    { name: "Other", value: totalCalls - completedCalls - failedCalls, color: "#94a3b8" },
  ].filter(d => d.value > 0);

  const callTypeData = [
    { name: "AI", value: aiCalls },
    { name: "Manual", value: (calls ?? []).filter(c => c.call_type === "manual").length },
    { name: "Campaign", value: (calls ?? []).filter(c => c.call_type === "campaign").length },
  ].filter(d => d.value > 0);

  const campaignTypeData = [
    { name: "Voice", value: (campaigns ?? []).filter(c => c.type === "voice").length },
    { name: "WhatsApp", value: (campaigns ?? []).filter(c => c.type === "whatsapp").length },
    { name: "SMS", value: (campaigns ?? []).filter(c => c.type === "sms").length },
  ].filter(d => d.value > 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" /> Communication Reports</h1><p className="text-muted-foreground">Analytics & performance metrics</p></div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />Total Calls</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalCalls}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle className="w-3 h-3" />Success Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{totalCalls > 0 ? `${Math.round(completedCalls / totalCalls * 100)}%` : "—"}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Avg Duration</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Math.floor(avgDuration / 60)}:{String(avgDuration % 60).padStart(2, "0")}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3 h-3" />Messages</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{totalMsgs}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle className="text-sm">Call Status Distribution</CardTitle></CardHeader><CardContent className="h-64">
            {callStatusData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={callStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{callStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>}
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-sm">Call Types</CardTitle></CardHeader><CardContent className="h-64">
            {callTypeData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={callTypeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={4} /></BarChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>}
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader><CardTitle className="text-sm">WhatsApp Stats</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Messages</span><span className="font-bold">{totalMsgs}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Bot Responses</span><span className="font-bold text-cyan-600">{botMsgs}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Delivered/Read</span><span className="font-bold text-green-600">{deliveredMsgs}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Bot %</span><span className="font-bold">{totalMsgs > 0 ? `${Math.round(botMsgs / totalMsgs * 100)}%` : "—"}</span></div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-sm">Campaign Summary</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Campaigns</span><span className="font-bold">{(campaigns ?? []).length}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Active</span><span className="font-bold text-green-600">{(campaigns ?? []).filter(c => c.status === "active").length}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Contacted</span><span className="font-bold">{(campaigns ?? []).reduce((s, c) => s + (c.contacted ?? 0), 0)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Successful</span><span className="font-bold text-green-600">{(campaigns ?? []).reduce((s, c) => s + (c.successful ?? 0), 0)}</span></div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-sm">Campaign Types</CardTitle></CardHeader><CardContent className="h-48">
            {campaignTypeData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={campaignTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>{campaignTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>}
          </CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
