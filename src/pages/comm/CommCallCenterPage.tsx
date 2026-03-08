import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Headphones, Phone, PhoneIncoming, PhoneOutgoing, Clock, Users, Loader2, Bot } from "lucide-react";
import { format } from "date-fns";

export default function CommCallCenterPage() {
  const { user } = useAuth();

  const { data: agents } = useQuery({ queryKey: ["comm_agents_cc"], queryFn: async () => { const { data } = await supabase.from("comm_agents").select("*").eq("is_active", true); return data ?? []; }, enabled: !!user });
  const { data: activeCalls } = useQuery({ queryKey: ["comm_calls_active"], queryFn: async () => { const { data } = await supabase.from("comm_calls").select("*, comm_contacts(name, phone), comm_agents(name)").in("status", ["initiated", "ringing", "in_progress"]).order("created_at", { ascending: false }); return data ?? []; }, enabled: !!user });
  const { data: recentCalls } = useQuery({ queryKey: ["comm_calls_recent"], queryFn: async () => { const { data } = await supabase.from("comm_calls").select("*, comm_contacts(name), comm_agents(name)").eq("status", "completed").order("created_at", { ascending: false }).limit(20); return data ?? []; }, enabled: !!user });
  const { data: queued } = useQuery({ queryKey: ["comm_conversations_queue"], queryFn: async () => { const { data } = await supabase.from("comm_conversations").select("*, comm_contacts(name)").eq("status", "waiting").order("created_at"); return data ?? []; }, enabled: !!user });

  const onlineAgents = (agents ?? []).filter(a => a.status === "online").length;
  const busyAgents = (agents ?? []).filter(a => a.status === "busy").length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Headphones className="w-6 h-6 text-primary" /> Call Center</h1><p className="text-muted-foreground">Live call center dashboard</p></div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-200"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5" />Agents Online</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{onlineAgents}</div></CardContent></Card>
          <Card className="border-orange-200"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Active Calls</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-orange-600">{(activeCalls ?? []).length}</div></CardContent></Card>
          <Card className="border-yellow-200"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" />In Queue</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-yellow-600">{(queued ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Headphones className="w-3.5 h-3.5" />Busy Agents</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-600">{busyAgents}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agent Status Board */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-1"><Users className="w-4 h-4" /> Agent Status Board</CardTitle></CardHeader>
            <CardContent>
              {(agents ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(agents ?? []).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${a.status === "online" ? "bg-green-500" : a.status === "busy" ? "bg-red-500" : a.status === "away" ? "bg-yellow-500" : "bg-gray-400"}`} />
                        <span className="font-medium text-sm">{a.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-xs">{a.role}</Badge>
                        <Badge variant={a.status === "online" ? "secondary" : "outline"} className="capitalize text-xs">{a.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="py-6 text-center text-muted-foreground text-sm">No agents configured</div>}
            </CardContent>
          </Card>

          {/* Active Calls */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-1"><Phone className="w-4 h-4 text-green-600" /> Active Calls</CardTitle></CardHeader>
            <CardContent>
              {(activeCalls ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(activeCalls ?? []).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 border rounded-lg border-green-200 bg-green-50/50">
                      <div>
                        <div className="font-medium text-sm">{c.comm_contacts?.name || c.to_number}</div>
                        <div className="text-xs text-muted-foreground">{c.comm_agents?.name || "AI"} • {c.direction}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.call_type === "ai" && <Badge variant="secondary" className="text-xs gap-0.5"><Bot className="w-2.5 h-2.5" />AI</Badge>}
                        <Badge variant="default" className="capitalize text-xs animate-pulse">{c.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="py-6 text-center text-muted-foreground text-sm">No active calls</div>}
            </CardContent>
          </Card>
        </div>

        {/* Queue */}
        {(queued ?? []).length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-1"><Clock className="w-4 h-4 text-yellow-600" /> Waiting Queue</CardTitle></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Customer</TableHead><TableHead>Channel</TableHead><TableHead>Wait Time</TableHead></TableRow></TableHeader>
                <TableBody>{(queued ?? []).map((q, i) => (
                  <TableRow key={q.id}><TableCell>{i + 1}</TableCell><TableCell className="font-medium">{q.comm_contacts?.name || "Unknown"}</TableCell><TableCell><Badge variant="outline" className="capitalize">{q.channel}</Badge></TableCell><TableCell>{q.created_at ? format(new Date(q.created_at), "HH:mm") : "—"}</TableCell></TableRow>
                ))}</TableBody></Table>
            </CardContent>
          </Card>
        )}

        {/* Recent Completed */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Completed Calls</CardTitle></CardHeader>
          <CardContent>
            {(recentCalls ?? []).length > 0 ? (
              <Table><TableHeader><TableRow><TableHead>Contact</TableHead><TableHead>Agent</TableHead><TableHead>Duration</TableHead><TableHead>Type</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
                <TableBody>{(recentCalls ?? []).map(c => (
                  <TableRow key={c.id}><TableCell className="font-medium">{c.comm_contacts?.name || "Unknown"}</TableCell><TableCell>{c.comm_agents?.name || "AI"}</TableCell><TableCell>{c.duration ? `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, "0")}` : "—"}</TableCell><TableCell><Badge variant="outline" className="capitalize text-xs">{c.call_type}</Badge></TableCell><TableCell className="text-sm">{format(new Date(c.created_at), "HH:mm")}</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <div className="py-6 text-center text-muted-foreground text-sm">No recent calls</div>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
