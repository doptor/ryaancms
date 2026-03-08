import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, UserCog, Search, Pencil, Trash2, Loader2 } from "lucide-react";

const ROLES = ["agent", "supervisor", "manager", "admin"];
const STATUSES = ["online", "offline", "busy", "away", "break"];
const emptyForm = { name: "", email: "", phone: "", role: "agent", max_concurrent_calls: "3", skills: "" };

export default function CommAgentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: agents, isLoading } = useQuery({
    queryKey: ["comm_agents"], queryFn: async () => { const { data, error } = await supabase.from("comm_agents").select("*").order("name"); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, email: form.email || null, phone: form.phone || null, role: form.role, max_concurrent_calls: parseInt(form.max_concurrent_calls) || 3, skills: form.skills ? form.skills.split(",").map(s => s.trim()) : [], user_id: user!.id };
      if (editId) { const { error } = await supabase.from("comm_agents").update(payload).eq("id", editId); if (error) throw error; }
      else { payload.status = "offline"; const { error } = await supabase.from("comm_agents").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_agents"] }); toast({ title: editId ? "Agent updated" : "Agent added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from("comm_agents").update({ status }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_agents"] }); toast({ title: "Status updated" }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("comm_agents").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_agents"] }); toast({ title: "Agent deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (a: any) => { setEditId(a.id); setForm({ name: a.name, email: a.email || "", phone: a.phone || "", role: a.role, max_concurrent_calls: String(a.max_concurrent_calls ?? 3), skills: (a.skills || []).join(", ") }); setOpen(true); };
  const filtered = (agents ?? []).filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s: string) => s === "online" ? "bg-green-500" : s === "busy" ? "bg-red-500" : s === "away" || s === "break" ? "bg-yellow-500" : "bg-gray-400";

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><UserCog className="w-6 h-6 text-primary" /> Agents</h1><p className="text-muted-foreground">Manage call center agents</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Agent</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit Agent" : "Add Agent"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Role</Label><Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Max Calls</Label><Input type="number" value={form.max_concurrent_calls} onChange={e => setForm({ ...form, max_concurrent_calls: e.target.value })} /></div>
                </div>
                <div><Label>Skills (comma separated)</Label><Input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="sales, support, billing" /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.name.trim()} className="w-full">{editId ? "Update" : "Add"} Agent</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Agents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(agents ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Online</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{(agents ?? []).filter(a => a.status === "online").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Busy</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{(agents ?? []).filter(a => a.status === "busy").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Offline</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-muted-foreground">{(agents ?? []).filter(a => a.status === "offline").length}</div></CardContent></Card>
        </div>

        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Contact</TableHead><TableHead>Role</TableHead><TableHead>Skills</TableHead><TableHead>Status</TableHead><TableHead>Calls</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(a => (
                <TableRow key={a.id}>
                  <TableCell><div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${statusColor(a.status)}`} /><span className="font-medium">{a.name}</span></div></TableCell>
                  <TableCell><div className="text-sm">{a.email || "—"}</div><div className="text-xs text-muted-foreground">{a.phone || ""}</div></TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{a.role}</Badge></TableCell>
                  <TableCell><div className="flex gap-1 flex-wrap">{(a.skills || []).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div></TableCell>
                  <TableCell><Select value={a.status} onValueChange={v => updateStatus.mutate({ id: a.id, status: v })}><SelectTrigger className="h-7 w-24"><Badge variant={a.status === "online" ? "secondary" : "outline"} className="capitalize">{a.status}</Badge></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell>{a.total_calls ?? 0}</TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end"><Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(a.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><UserCog className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Agents</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
