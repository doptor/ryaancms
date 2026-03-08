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
import { Plus, Award, Search, Pencil, Trash2, Loader2 } from "lucide-react";

const emptyForm = { name: "", university_id: "", description: "", amount: "0", currency: "USD", type: "merit", eligibility: "", deadline: "" };

export default function EducaScholarshipsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: scholarships, isLoading } = useQuery({
    queryKey: ["educa_scholarships"], queryFn: async () => { const { data, error } = await supabase.from("educa_scholarships").select("*, educa_universities(name)").order("name"); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const { data: universities } = useQuery({ queryKey: ["educa_unis_sch"], queryFn: async () => { const { data } = await supabase.from("educa_universities").select("id, name").order("name"); return data ?? []; }, enabled: !!user });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, university_id: form.university_id || null, description: form.description || null, amount: parseFloat(form.amount) || 0, currency: form.currency, type: form.type, eligibility: form.eligibility || null, deadline: form.deadline || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("educa_scholarships").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("educa_scholarships").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_scholarships"] }); toast({ title: editId ? "Scholarship updated" : "Scholarship added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_scholarships").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_scholarships"] }); toast({ title: "Scholarship deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (s: any) => { setEditId(s.id); setForm({ name: s.name, university_id: s.university_id || "", description: s.description || "", amount: s.amount?.toString() || "0", currency: s.currency || "USD", type: s.type || "merit", eligibility: s.eligibility || "", deadline: s.deadline || "" }); setOpen(true); };

  const filtered = (scholarships ?? []).filter(s => { const q = search.toLowerCase(); return !q || s.name.toLowerCase().includes(q); });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Award className="w-6 h-6 text-primary" /> Scholarships</h1><p className="text-muted-foreground">Manage scholarship programs</p></div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-64" /></div>
            <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Add</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editId ? "Edit Scholarship" : "Add Scholarship"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>University</Label><Select value={form.university_id} onValueChange={v => setForm(p => ({ ...p, university_id: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{(universities ?? []).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Type</Label><Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="merit">Merit</SelectItem><SelectItem value="need_based">Need Based</SelectItem><SelectItem value="sports">Sports</SelectItem><SelectItem value="government">Government</SelectItem><SelectItem value="full">Full Scholarship</SelectItem></SelectContent></Select></div>
                  <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                  <div><Label>Currency</Label><Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["USD", "AUD", "GBP", "CAD", "EUR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} /></div>
                  <div><Label>Eligibility</Label><Input value={form.eligibility} onChange={e => setForm(p => ({ ...p, eligibility: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                </div>
                <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending}>{editId ? "Update" : "Add"}</Button></div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card><CardContent className="p-0">
          {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No scholarships found</div> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>University</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Deadline</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(s => (
                <TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell>{(s as any).educa_universities?.name || "—"}</TableCell><TableCell className="capitalize">{(s.type || "").replace(/_/g, " ")}</TableCell><TableCell>{s.currency} {s.amount?.toLocaleString()}</TableCell><TableCell>{s.deadline || "—"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>
              ))}</TableBody></Table></div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
