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
import { Plus, DollarSign, Search, Pencil, Trash2, Loader2 } from "lucide-react";

const TYPES = ["university_to_consultancy", "consultancy_to_agent"];
const STATUSES = ["pending", "invoiced", "paid", "overdue", "cancelled"];
const emptyForm = { agent_id: "", student_id: "", university_id: "", type: "university_to_consultancy", amount: "0", currency: "USD", status: "pending", invoice_number: "", payment_date: "", due_date: "", notes: "" };

export default function EducaCommissionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: commissions, isLoading } = useQuery({
    queryKey: ["educa_commissions"], queryFn: async () => { const { data, error } = await supabase.from("educa_commissions").select("*, educa_students(name), educa_agents(name), educa_universities(name)").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const { data: agents } = useQuery({ queryKey: ["educa_agents_sel"], queryFn: async () => { const { data } = await supabase.from("educa_agents").select("id, name"); return data ?? []; }, enabled: !!user });
  const { data: students } = useQuery({ queryKey: ["educa_students_sel2"], queryFn: async () => { const { data } = await supabase.from("educa_students").select("id, name"); return data ?? []; }, enabled: !!user });
  const { data: universities } = useQuery({ queryKey: ["educa_unis_sel"], queryFn: async () => { const { data } = await supabase.from("educa_universities").select("id, name"); return data ?? []; }, enabled: !!user });

  const totalPending = (commissions ?? []).filter(c => c.status === "pending").reduce((s, c) => s + (c.amount || 0), 0);
  const totalPaid = (commissions ?? []).filter(c => c.status === "paid").reduce((s, c) => s + (c.amount || 0), 0);

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { agent_id: form.agent_id || null, student_id: form.student_id || null, university_id: form.university_id || null, type: form.type, amount: parseFloat(form.amount) || 0, currency: form.currency, status: form.status, invoice_number: form.invoice_number || null, payment_date: form.payment_date || null, due_date: form.due_date || null, notes: form.notes || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("educa_commissions").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("educa_commissions").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_commissions"] }); toast({ title: editId ? "Commission updated" : "Commission added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_commissions").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_commissions"] }); toast({ title: "Commission deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (c: any) => { setEditId(c.id); setForm({ agent_id: c.agent_id || "", student_id: c.student_id || "", university_id: c.university_id || "", type: c.type || "university_to_consultancy", amount: c.amount?.toString() || "0", currency: c.currency || "USD", status: c.status || "pending", invoice_number: c.invoice_number || "", payment_date: c.payment_date || "", due_date: c.due_date || "", notes: c.notes || "" }); setOpen(true); };

  const filtered = (commissions ?? []).filter(c => { const q = search.toLowerCase(); return !q || (c as any).educa_students?.name?.toLowerCase().includes(q) || (c as any).educa_agents?.name?.toLowerCase().includes(q) || (c.invoice_number || "").toLowerCase().includes(q); });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary" /> Commissions</h1><p className="text-muted-foreground">Track commissions & payouts</p></div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-64" /></div>
            <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Add Commission</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editId ? "Edit Commission" : "Add Commission"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Type</Label><Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " → ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                  <div><Label>Student</Label><Select value={form.student_id} onValueChange={v => setForm(p => ({ ...p, student_id: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{(students ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Agent</Label><Select value={form.agent_id} onValueChange={v => setForm(p => ({ ...p, agent_id: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{(agents ?? []).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>University</Label><Select value={form.university_id} onValueChange={v => setForm(p => ({ ...p, university_id: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{(universities ?? []).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Invoice #</Label><Input value={form.invoice_number} onChange={e => setForm(p => ({ ...p, invoice_number: e.target.value }))} /></div>
                  <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} /></div>
                  <div><Label>Payment Date</Label><Input type="date" value={form.payment_date} onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))} /></div>
                  <div><Label>Currency</Label><Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["USD", "AUD", "GBP", "CAD", "EUR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                </div>
                <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>{editId ? "Update" : "Add"}</Button></div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">${totalPending.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Paid</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</div></CardContent></Card>
        </div>

        <Card><CardContent className="p-0">
          {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No commissions found</div> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Student</TableHead><TableHead>Agent</TableHead><TableHead>University</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Invoice</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(c => (
                <TableRow key={c.id}><TableCell className="text-sm capitalize">{(c.type || "").replace(/_/g, " → ")}</TableCell><TableCell>{(c as any).educa_students?.name || "—"}</TableCell><TableCell>{(c as any).educa_agents?.name || "—"}</TableCell><TableCell>{(c as any).educa_universities?.name || "—"}</TableCell><TableCell className="font-medium">{c.currency} {c.amount?.toLocaleString()}</TableCell><TableCell><Badge variant={c.status === "paid" ? "secondary" : c.status === "overdue" ? "destructive" : "outline"} className="capitalize text-xs">{c.status}</Badge></TableCell><TableCell className="text-sm">{c.invoice_number || "—"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>
              ))}</TableBody></Table></div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
