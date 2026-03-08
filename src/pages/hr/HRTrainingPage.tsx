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
import { Plus, GraduationCap, Search, Pencil, Trash2, Loader2, UserPlus, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const PROG_STATUSES = ["planned", "in_progress", "completed", "cancelled"];
const emptyForm = { name: "", description: "", trainer: "", start_date: "", end_date: "", location: "", max_participants: "20", cost: "0" };
const emptyEnrollForm = { program_id: "", employee_id: "" };

export default function HRTrainingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [enrollForm, setEnrollForm] = useState(emptyEnrollForm);

  const { data: programs, isLoading } = useQuery({
    queryKey: ["hr_training_programs"], queryFn: async () => { const { data, error } = await supabase.from("hr_training_programs").select("*").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: enrollments } = useQuery({
    queryKey: ["hr_training_enrollments"], queryFn: async () => { const { data } = await supabase.from("hr_training_enrollments").select("*, hr_employees(name), hr_training_programs(name)"); return data ?? []; }, enabled: !!user,
  });
  const { data: employees } = useQuery({ queryKey: ["hr_emp_train"], queryFn: async () => { const { data } = await supabase.from("hr_employees").select("id, name").eq("status", "active"); return data ?? []; }, enabled: !!user });

  const upsertProgram = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, description: form.description || null, trainer: form.trainer || null, start_date: form.start_date || null, end_date: form.end_date || null, location: form.location || null, max_participants: parseInt(form.max_participants) || 20, cost: parseFloat(form.cost) || 0, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("hr_training_programs").update(payload).eq("id", editId); if (error) throw error; }
      else { payload.status = "planned"; const { error } = await supabase.from("hr_training_programs").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_training_programs"] }); toast({ title: editId ? "Program updated" : "Program created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const enrollMut = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("hr_training_enrollments").insert({ program_id: enrollForm.program_id, employee_id: enrollForm.employee_id, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_training_enrollments"] }); toast({ title: "Employee enrolled" }); setEnrollOpen(false); setEnrollForm(emptyEnrollForm); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateProgStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from("hr_training_programs").update({ status }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_training_programs"] }); toast({ title: "Status updated" }); },
  });

  const completeEnrollment = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_training_enrollments").update({ status: "completed", completion_date: format(new Date(), "yyyy-MM-dd") }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_training_enrollments"] }); toast({ title: "Marked as completed" }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_training_programs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_training_programs"] }); toast({ title: "Program deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => { setEditId(r.id); setForm({ name: r.name, description: r.description || "", trainer: r.trainer || "", start_date: r.start_date || "", end_date: r.end_date || "", location: r.location || "", max_participants: String(r.max_participants ?? 20), cost: String(r.cost ?? 0) }); setOpen(true); };

  const filtered = (programs ?? []).filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));
  const enrollCount = (progId: string) => (enrollments ?? []).filter(e => e.program_id === progId).length;
  const totalCost = (programs ?? []).reduce((s, p) => s + Number(p.cost ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6 text-primary" /> Training & Development</h1><p className="text-muted-foreground">Training programs, enrollments & certifications</p></div>
          <div className="flex gap-2">
            <Dialog open={enrollOpen} onOpenChange={v => { setEnrollOpen(v); if (!v) setEnrollForm(emptyEnrollForm); }}>
              <DialogTrigger asChild><Button variant="outline"><UserPlus className="w-4 h-4 mr-2" />Enroll</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Enroll Employee</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Program *</Label><Select value={enrollForm.program_id} onValueChange={v => setEnrollForm({ ...enrollForm, program_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(programs ?? []).filter(p => p.status !== "cancelled").map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Employee *</Label><Select value={enrollForm.employee_id} onValueChange={v => setEnrollForm({ ...enrollForm, employee_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(employees ?? []).map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                  <Button onClick={() => enrollMut.mutate()} disabled={!enrollForm.program_id || !enrollForm.employee_id} className="w-full">Enroll</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Program</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editId ? "Edit Program" : "Create Training Program"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Program Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Trainer</Label><Input value={form.trainer} onChange={e => setForm({ ...form, trainer: e.target.value })} /></div>
                    <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                    <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Max Participants</Label><Input type="number" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} /></div>
                    <div><Label>Cost</Label><Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                  <Button onClick={() => upsertProgram.mutate()} disabled={!form.name.trim()} className="w-full">{editId ? "Update" : "Create"} Program</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Programs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(programs ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Enrollments</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{(enrollments ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Investment</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">${totalCost.toLocaleString()}</div></CardContent></Card>
        </div>

        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Program</TableHead><TableHead>Trainer</TableHead><TableHead>Dates</TableHead><TableHead className="text-center">Enrolled</TableHead><TableHead>Cost</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.trainer || "—"}</TableCell>
                  <TableCell>{r.start_date ? format(new Date(r.start_date), "MMM dd") : "—"}{r.end_date ? ` – ${format(new Date(r.end_date), "MMM dd")}` : ""}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{enrollCount(r.id)}/{r.max_participants}</Badge></TableCell>
                  <TableCell>${Number(r.cost ?? 0).toLocaleString()}</TableCell>
                  <TableCell><Select value={r.status || "planned"} onValueChange={v => updateProgStatus.mutate({ id: r.id, status: v })}><SelectTrigger className="h-7 w-28"><Badge variant={r.status === "completed" ? "secondary" : "outline"} className="capitalize">{r.status}</Badge></SelectTrigger><SelectContent>{PROG_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end"><Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div></TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Training Programs</h3></div>}
        </CardContent></Card>

        {(enrollments ?? []).length > 0 && (
          <Card><CardHeader><CardTitle className="text-sm">Recent Enrollments</CardTitle></CardHeader><CardContent>
            <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Program</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{(enrollments ?? []).slice(0, 10).map(e => (
                <TableRow key={e.id}><TableCell className="font-medium">{e.hr_employees?.name}</TableCell><TableCell>{e.hr_training_programs?.name}</TableCell>
                  <TableCell><Badge variant={e.status === "completed" ? "secondary" : "outline"} className="capitalize">{e.status}</Badge></TableCell>
                  <TableCell className="text-right">{e.status !== "completed" && <Button size="sm" variant="outline" onClick={() => completeEnrollment.mutate(e.id)}><CheckCircle className="w-3.5 h-3.5 mr-1" />Complete</Button>}</TableCell></TableRow>
              ))}</TableBody></Table>
          </CardContent></Card>
        )}
      </div>
    </DashboardLayout>
  );
}
