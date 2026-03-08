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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Briefcase, Search, Pencil, Trash2, Loader2 } from "lucide-react";

const emptyForm = { name: "", description: "" };

export default function HRDepartmentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: departments, isLoading } = useQuery({
    queryKey: ["hr_departments"], queryFn: async () => { const { data, error } = await supabase.from("hr_departments").select("*").order("name"); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const { data: empCounts } = useQuery({
    queryKey: ["hr_emp_counts"], queryFn: async () => { const { data } = await supabase.from("hr_employees").select("department_id").eq("status", "active"); return data ?? []; }, enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, description: form.description || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("hr_departments").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("hr_departments").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_departments"] }); toast({ title: editId ? "Department updated" : "Department created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_departments").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_departments"] }); toast({ title: "Department deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => { setEditId(r.id); setForm({ name: r.name, description: r.description || "" }); setOpen(true); };
  const filtered = (departments ?? []).filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));
  const countFor = (deptId: string) => (empCounts ?? []).filter(e => e.department_id === deptId).length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="w-6 h-6 text-primary" /> Departments</h1><p className="text-muted-foreground">Manage organizational structure</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Department</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Department</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.name.trim()} className="w-full">{editId ? "Update" : "Create"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead className="text-center">Employees</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.description || "—"}</TableCell><TableCell className="text-center">{countFor(r.id)}</TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end"><Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div></TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Departments</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
