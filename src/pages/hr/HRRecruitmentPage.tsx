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
import { Plus, FileText, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

const JOB_STATUSES = ["open", "closed", "on_hold", "filled"];
const emptyForm = { title: "", department_id: "", description: "", requirements: "", employment_type: "full_time", salary_min: "", salary_max: "", location: "", positions: "1", deadline: "" };

export default function HRRecruitmentPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["hr_job_postings"], queryFn: async () => { const { data, error } = await supabase.from("hr_job_postings").select("*, hr_departments(name)").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: departments } = useQuery({ queryKey: ["hr_depts_recruit"], queryFn: async () => { const { data } = await supabase.from("hr_departments").select("id, name"); return data ?? []; }, enabled: !!user });
  const { data: applicantCounts } = useQuery({ queryKey: ["hr_app_counts"], queryFn: async () => { const { data } = await supabase.from("hr_applicants").select("job_id"); return data ?? []; }, enabled: !!user });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { title: form.title, department_id: form.department_id || null, description: form.description || null, requirements: form.requirements || null, employment_type: form.employment_type, salary_min: parseFloat(form.salary_min) || null, salary_max: parseFloat(form.salary_max) || null, location: form.location || null, positions: parseInt(form.positions) || 1, deadline: form.deadline || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("hr_job_postings").update(payload).eq("id", editId); if (error) throw error; }
      else { payload.status = "open"; const { error } = await supabase.from("hr_job_postings").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_job_postings"] }); toast({ title: editId ? "Job updated" : "Job posted" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from("hr_job_postings").update({ status }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_job_postings"] }); toast({ title: "Status updated" }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_job_postings").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_job_postings"] }); toast({ title: "Job deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => { setEditId(r.id); setForm({ title: r.title, department_id: r.department_id || "", description: r.description || "", requirements: r.requirements || "", employment_type: r.employment_type || "full_time", salary_min: String(r.salary_min ?? ""), salary_max: String(r.salary_max ?? ""), location: r.location || "", positions: String(r.positions ?? 1), deadline: r.deadline || "" }); setOpen(true); };

  const filtered = (jobs ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const appCount = (jobId: string) => (applicantCounts ?? []).filter(a => a.job_id === jobId).length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-primary" /> Job Postings</h1><p className="text-muted-foreground">Manage recruitment and job openings</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Post Job</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Job" : "Post Job"}</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Department</Label><Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="">None</SelectItem>{(departments ?? []).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Type</Label><Select value={form.employment_type} onValueChange={v => setForm({ ...form, employment_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full_time">Full Time</SelectItem><SelectItem value="part_time">Part Time</SelectItem><SelectItem value="contract">Contract</SelectItem><SelectItem value="intern">Intern</SelectItem></SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Salary Min</Label><Input type="number" value={form.salary_min} onChange={e => setForm({ ...form, salary_min: e.target.value })} /></div>
                  <div><Label>Salary Max</Label><Input type="number" value={form.salary_max} onChange={e => setForm({ ...form, salary_max: e.target.value })} /></div>
                  <div><Label>Positions</Label><Input type="number" value={form.positions} onChange={e => setForm({ ...form, positions: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                  <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <div><Label>Requirements</Label><Textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} rows={3} /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.title.trim()} className="w-full">{editId ? "Update" : "Post"} Job</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{JOB_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
        </div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Department</TableHead><TableHead>Type</TableHead><TableHead>Location</TableHead><TableHead className="text-center">Applicants</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.title}</TableCell><TableCell>{(r as any).hr_departments?.name || "—"}</TableCell><TableCell className="capitalize">{(r.employment_type || "").replace(/_/g, " ")}</TableCell><TableCell>{r.location || "—"}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{appCount(r.id)}</Badge></TableCell>
                  <TableCell><Select value={r.status || "open"} onValueChange={v => updateStatus.mutate({ id: r.id, status: v })}><SelectTrigger className="h-7 w-24"><Badge variant={r.status === "open" ? "secondary" : "outline"} className="capitalize">{r.status}</Badge></SelectTrigger><SelectContent>{JOB_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end"><Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div></TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Job Postings</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
