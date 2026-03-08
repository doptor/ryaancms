import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Users, Search, Pencil, Trash2, Loader2 } from "lucide-react";

const STATUSES = ["pending", "approved", "suspended", "terminated"];
const emptyForm = { name: "", company: "", email: "", phone: "", country: "", commission_rate: "10", status: "pending", contract_start: "", contract_end: "", notes: "" };

export default function EducaAgentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: agents, isLoading } = useQuery({
    queryKey: ["educa_agents"], queryFn: async () => { const { data, error } = await supabase.from("educa_agents").select("*").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, company: form.company || null, email: form.email || null, phone: form.phone || null, country: form.country || null, commission_rate: parseFloat(form.commission_rate) || 0, status: form.status, contract_start: form.contract_start || null, contract_end: form.contract_end || null, notes: form.notes || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("educa_agents").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("educa_agents").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_agents"] }); toast({ title: editId ? "Agent updated" : "Agent added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_agents").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_agents"] }); toast({ title: "Agent deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (a: any) => { setEditId(a.id); setForm({ name: a.name, company: a.company || "", email: a.email || "", phone: a.phone || "", country: a.country || "", commission_rate: a.commission_rate?.toString() || "10", status: a.status || "pending", contract_start: a.contract_start || "", contract_end: a.contract_end || "", notes: a.notes || "" }); setOpen(true); };

  const filtered = (agents ?? []).filter(a => { const q = search.toLowerCase(); return !q || a.name.toLowerCase().includes(q) || (a.company || "").toLowerCase().includes(q) || (a.country || "").toLowerCase().includes(q); });

  const statusColor = (s: string) => s === "approved" ? "secondary" : s === "pending" ? "outline" : "destructive";

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Agents</h1><p className="text-muted-foreground">Manage recruitment agents</p></div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-64" /></div>
            <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Add Agent</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editId ? "Edit Agent" : "Add Agent"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Company</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div><Label>Country</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
                  <div><Label>Commission Rate (%)</Label><Input type="number" value={form.commission_rate} onChange={e => setForm(p => ({ ...p, commission_rate: e.target.value }))} /></div>
                  <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Contract Start</Label><Input type="date" value={form.contract_start} onChange={e => setForm(p => ({ ...p, contract_start: e.target.value }))} /></div>
                  <div><Label>Contract End</Label><Input type="date" value={form.contract_end} onChange={e => setForm(p => ({ ...p, contract_end: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                </div>
                <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending}>{editId ? "Update" : "Add"}</Button></div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card><CardContent className="p-0">
          {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No agents found</div> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Company</TableHead><TableHead>Country</TableHead><TableHead>Commission</TableHead><TableHead>Students</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(a => (
                <TableRow key={a.id}><TableCell className="font-medium">{a.name}</TableCell><TableCell>{a.company || "—"}</TableCell><TableCell>{a.country || "—"}</TableCell><TableCell>{a.commission_rate}%</TableCell><TableCell>{a.total_students}</TableCell><TableCell><Badge variant={statusColor(a.status || "")} className="capitalize text-xs">{a.status}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>
              ))}</TableBody></Table></div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
