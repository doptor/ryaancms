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
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Plus, Megaphone, Search, Pencil, Trash2, Loader2, Play, Pause, Phone, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["draft", "scheduled", "active", "paused", "completed", "cancelled"];
const emptyForm = { name: "", description: "", type: "voice", script_id: "", scheduled_at: "", total_contacts: "0" };

export default function CommCampaignsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["comm_campaigns"], queryFn: async () => { const { data, error } = await supabase.from("comm_campaigns").select("*, comm_scripts(name)").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: scripts } = useQuery({ queryKey: ["comm_scripts_sel"], queryFn: async () => { const { data } = await supabase.from("comm_scripts").select("id, name, type"); return data ?? []; }, enabled: !!user });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, description: form.description || null, type: form.type, script_id: form.script_id || null, scheduled_at: form.scheduled_at || null, total_contacts: parseInt(form.total_contacts) || 0, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("comm_campaigns").update(payload).eq("id", editId); if (error) throw error; }
      else { payload.status = "draft"; const { error } = await supabase.from("comm_campaigns").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_campaigns"] }); toast({ title: editId ? "Campaign updated" : "Campaign created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (status === "active") {
        // Launch campaign via edge function
        const { data, error } = await supabase.functions.invoke("comm-campaign", {
          body: { action: "start-campaign", campaign_id: id },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Campaign launch failed");
        return;
      }
      if (status === "paused") {
        await supabase.functions.invoke("comm-campaign", { body: { action: "pause-campaign", campaign_id: id } });
        return;
      }
      const updates: any = { status };
      if (status === "completed") updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from("comm_campaigns").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_campaigns"] }); toast({ title: "Campaign status updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("comm_campaigns").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_campaigns"] }); toast({ title: "Campaign deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (c: any) => { setEditId(c.id); setForm({ name: c.name, description: c.description || "", type: c.type, script_id: c.script_id || "", scheduled_at: c.scheduled_at ? format(new Date(c.scheduled_at), "yyyy-MM-dd'T'HH:mm") : "", total_contacts: String(c.total_contacts ?? 0) }); setOpen(true); };
  const filtered = (campaigns ?? []).filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6 text-primary" /> Campaigns</h1><p className="text-muted-foreground">Voice & WhatsApp campaign management</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Campaign</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit Campaign" : "Create Campaign"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Campaign Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="voice">Voice Call</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="sms">SMS</SelectItem></SelectContent></Select></div>
                  <div><Label>AI Script</Label><Select value={form.script_id} onValueChange={v => setForm({ ...form, script_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="">None</SelectItem>{(scripts ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Schedule</Label><Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} /></div>
                  <div><Label>Total Contacts</Label><Input type="number" value={form.total_contacts} onChange={e => setForm({ ...form, total_contacts: e.target.value })} /></div>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.name.trim()} className="w-full">{editId ? "Update" : "Create"} Campaign</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(campaigns ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{(campaigns ?? []).filter(c => c.status === "active").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{(campaigns ?? []).filter(c => c.status === "completed").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Success Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{(() => { const t = (campaigns ?? []).reduce((s, c) => s + (c.contacted ?? 0), 0); const su = (campaigns ?? []).reduce((s, c) => s + (c.successful ?? 0), 0); return t > 0 ? `${Math.round(su / t * 100)}%` : "—"; })()}</div></CardContent></Card>
        </div>

        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Type</TableHead><TableHead>Script</TableHead><TableHead>Progress</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(c => {
                const progress = c.total_contacts > 0 ? Math.round((c.contacted ?? 0) / c.total_contacts * 100) : 0;
                return (
                <TableRow key={c.id}>
                  <TableCell><div className="font-medium">{c.name}</div>{c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize gap-1">{c.type === "voice" ? <Phone className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}{c.type}</Badge></TableCell>
                  <TableCell className="text-sm">{c.comm_scripts?.name || "—"}</TableCell>
                  <TableCell><div className="w-24"><Progress value={progress} className="h-2" /><div className="text-xs text-muted-foreground mt-0.5">{c.contacted ?? 0}/{c.total_contacts} ({progress}%)</div></div></TableCell>
                  <TableCell><Select value={c.status} onValueChange={v => updateStatus.mutate({ id: c.id, status: v })}><SelectTrigger className="h-7 w-28"><Badge variant={c.status === "active" ? "secondary" : c.status === "completed" ? "default" : "outline"} className="capitalize">{c.status}</Badge></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end">
                    {c.status === "draft" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: c.id, status: "active" })}><Play className="w-3.5 h-3.5" /></Button>}
                    {c.status === "active" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: c.id, status: "paused" })}><Pause className="w-3.5 h-3.5" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(c.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div></TableCell>
                </TableRow>);
              })}</TableBody></Table>
          ) : <div className="py-12 text-center"><Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Campaigns</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
