import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Phone, Search, Loader2, PhoneIncoming, PhoneOutgoing, PhoneMissed, Bot, Play, Trash2 } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["initiated", "ringing", "in_progress", "completed", "failed", "no_answer", "busy"];
const emptyForm = { contact_id: "", direction: "outbound", call_type: "ai", to_number: "", notes: "" };

export default function CommCallsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: calls, isLoading } = useQuery({
    queryKey: ["comm_calls"], queryFn: async () => { const { data, error } = await supabase.from("comm_calls").select("*, comm_contacts(name, phone), comm_agents(name)").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: contacts } = useQuery({ queryKey: ["comm_contacts_sel"], queryFn: async () => { const { data } = await supabase.from("comm_contacts").select("id, name, phone"); return data ?? []; }, enabled: !!user });

  const createCall = useMutation({
    mutationFn: async () => {
      const contact = (contacts ?? []).find(c => c.id === form.contact_id);
      const { error } = await supabase.from("comm_calls").insert({
        contact_id: form.contact_id || null, direction: form.direction, call_type: form.call_type,
        to_number: form.to_number || contact?.phone || null, status: "initiated",
        notes: form.notes || null, user_id: user!.id, started_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_calls"] }); toast({ title: "Call initiated" }); setOpen(false); setForm(emptyForm); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("comm_calls").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_calls"] }); toast({ title: "Call log deleted" }); },
  });

  const filtered = (calls ?? []).filter(c => { const q = search.toLowerCase(); return !q || (c.comm_contacts?.name || "").toLowerCase().includes(q) || (c.to_number || "").includes(q); });
  const statusIcon = (s: string) => { if (s === "completed") return <Badge variant="secondary" className="capitalize gap-1"><Phone className="w-3 h-3" />{s}</Badge>; if (s === "failed" || s === "no_answer") return <Badge variant="destructive" className="capitalize gap-1"><PhoneMissed className="w-3 h-3" />{s}</Badge>; return <Badge variant="outline" className="capitalize">{s}</Badge>; };
  const dirIcon = (d: string) => d === "inbound" ? <PhoneIncoming className="w-4 h-4 text-green-600" /> : <PhoneOutgoing className="w-4 h-4 text-blue-600" />;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Phone className="w-6 h-6 text-primary" /> Voice Calls</h1><p className="text-muted-foreground">AI voice calls & call logs</p></div>
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setForm(emptyForm); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Call</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Initiate Call</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Contact</Label><Select value={form.contact_id} onValueChange={v => setForm({ ...form, contact_id: v })}><SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger><SelectContent>{(contacts ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Phone Number</Label><Input value={form.to_number} onChange={e => setForm({ ...form, to_number: e.target.value })} placeholder="+880..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Direction</Label><Select value={form.direction} onValueChange={v => setForm({ ...form, direction: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="outbound">Outbound</SelectItem><SelectItem value="inbound">Inbound</SelectItem></SelectContent></Select></div>
                  <div><Label>Call Type</Label><Select value={form.call_type} onValueChange={v => setForm({ ...form, call_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ai">AI Call</SelectItem><SelectItem value="manual">Manual</SelectItem><SelectItem value="campaign">Campaign</SelectItem></SelectContent></Select></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                <Button onClick={() => createCall.mutate()} className="w-full"><Phone className="w-4 h-4 mr-2" />Start Call</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Calls</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(calls ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{(calls ?? []).filter(c => c.status === "completed").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">AI Calls</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-cyan-600">{(calls ?? []).filter(c => c.call_type === "ai").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Duration</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Math.floor((calls ?? []).reduce((s, c) => s + (c.duration ?? 0), 0) / 60)}m</div></CardContent></Card>
        </div>

        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search calls..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead></TableHead><TableHead>Contact</TableHead><TableHead>Number</TableHead><TableHead>Type</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{dirIcon(c.direction)}</TableCell>
                  <TableCell className="font-medium">{c.comm_contacts?.name || "Unknown"}</TableCell>
                  <TableCell className="text-sm">{c.to_number || "—"}</TableCell>
                  <TableCell><Badge variant={c.call_type === "ai" ? "secondary" : "outline"} className="capitalize gap-1">{c.call_type === "ai" && <Bot className="w-3 h-3" />}{c.call_type}</Badge></TableCell>
                  <TableCell>{c.duration ? `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, "0")}` : "—"}</TableCell>
                  <TableCell>{statusIcon(c.status)}</TableCell>
                  <TableCell className="text-sm">{format(new Date(c.created_at), "MMM dd, HH:mm")}</TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end">
                    {c.recording_url && <Button size="sm" variant="ghost"><Play className="w-3.5 h-3.5" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(c.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Calls Yet</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
