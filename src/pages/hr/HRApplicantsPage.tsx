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
import { Plus, UserPlus, Search, Pencil, Trash2, Loader2, Star, UserCheck } from "lucide-react";
import { format } from "date-fns";

const APP_STATUSES = ["applied", "screening", "interview", "offer", "hired", "rejected"];
const emptyForm = { job_id: "", name: "", email: "", phone: "", experience_years: "0", current_salary: "", expected_salary: "", cover_letter: "", interview_date: "", interview_notes: "", rating: "0" };

export default function HRApplicantsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: applicants, isLoading } = useQuery({
    queryKey: ["hr_applicants"], queryFn: async () => { const { data, error } = await supabase.from("hr_applicants").select("*, hr_job_postings(title)").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: jobs } = useQuery({ queryKey: ["hr_jobs_app"], queryFn: async () => { const { data } = await supabase.from("hr_job_postings").select("id, title").eq("status", "open"); return data ?? []; }, enabled: !!user });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { job_id: form.job_id, name: form.name, email: form.email || null, phone: form.phone || null, experience_years: parseInt(form.experience_years) || 0, current_salary: parseFloat(form.current_salary) || null, expected_salary: parseFloat(form.expected_salary) || null, cover_letter: form.cover_letter || null, interview_date: form.interview_date || null, interview_notes: form.interview_notes || null, rating: parseInt(form.rating) || 0, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("hr_applicants").update(payload).eq("id", editId); if (error) throw error; }
      else { payload.status = "applied"; const { error } = await supabase.from("hr_applicants").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_applicants"] }); toast({ title: editId ? "Applicant updated" : "Applicant added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from("hr_applicants").update({ status }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_applicants"] }); toast({ title: "Status updated" }); },
  });

  const hireApplicant = useMutation({
    mutationFn: async (app: any) => {
      // Create employee from applicant
      const empId = `EMP-${Date.now().toString(36).toUpperCase()}`;
      const { error: empErr } = await supabase.from("hr_employees").insert({
        employee_id: empId, name: app.name, email: app.email, phone: app.phone,
        hire_date: format(new Date(), "yyyy-MM-dd"), basic_salary: app.expected_salary || 0,
        status: "active", user_id: user!.id,
      });
      if (empErr) throw empErr;
      // Mark as hired
      const { error: upErr } = await supabase.from("hr_applicants").update({ status: "hired" }).eq("id", app.id);
      if (upErr) throw upErr;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_applicants"] }); qc.invalidateQueries({ queryKey: ["hr_employees"] }); toast({ title: "Applicant hired & added to employees!" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_applicants").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_applicants"] }); toast({ title: "Applicant removed" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => { setEditId(r.id); setForm({ job_id: r.job_id, name: r.name, email: r.email || "", phone: r.phone || "", experience_years: String(r.experience_years ?? 0), current_salary: String(r.current_salary ?? ""), expected_salary: String(r.expected_salary ?? ""), cover_letter: r.cover_letter || "", interview_date: r.interview_date ? format(new Date(r.interview_date), "yyyy-MM-dd'T'HH:mm") : "", interview_notes: r.interview_notes || "", rating: String(r.rating ?? 0) }); setOpen(true); };

  const filtered = (applicants ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusColor: Record<string, string> = { applied: "outline", screening: "outline", interview: "default", offer: "secondary", hired: "secondary", rejected: "destructive" };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><UserPlus className="w-6 h-6 text-primary" /> Applicants</h1><p className="text-muted-foreground">Track job applicants through the hiring pipeline</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Applicant</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Applicant" : "Add Applicant"}</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div><Label>Job Position *</Label><Select value={form.job_id} onValueChange={v => setForm({ ...form, job_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(jobs ?? []).map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Experience (yrs)</Label><Input type="number" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} /></div>
                  <div><Label>Rating (0-5)</Label><Input type="number" min="0" max="5" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Current Salary</Label><Input type="number" value={form.current_salary} onChange={e => setForm({ ...form, current_salary: e.target.value })} /></div>
                  <div><Label>Expected Salary</Label><Input type="number" value={form.expected_salary} onChange={e => setForm({ ...form, expected_salary: e.target.value })} /></div>
                </div>
                <div><Label>Interview Date</Label><Input type="datetime-local" value={form.interview_date} onChange={e => setForm({ ...form, interview_date: e.target.value })} /></div>
                <div><Label>Cover Letter</Label><Textarea value={form.cover_letter} onChange={e => setForm({ ...form, cover_letter: e.target.value })} rows={2} /></div>
                <div><Label>Interview Notes</Label><Textarea value={form.interview_notes} onChange={e => setForm({ ...form, interview_notes: e.target.value })} rows={2} /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.job_id || !form.name.trim()} className="w-full">{editId ? "Update" : "Add"} Applicant</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(applicants ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Interview</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{(applicants ?? []).filter(a => a.status === "interview").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Offers Made</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{(applicants ?? []).filter(a => a.status === "offer").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Hired</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{(applicants ?? []).filter(a => a.status === "hired").length}</div></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{APP_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
        </div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Position</TableHead><TableHead>Experience</TableHead><TableHead>Rating</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.name}<br /><span className="text-xs text-muted-foreground">{r.email}</span></TableCell>
                  <TableCell>{(r as any).hr_job_postings?.title || "—"}</TableCell>
                  <TableCell>{r.experience_years}y</TableCell>
                  <TableCell><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < (r.rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />)}</div></TableCell>
                  <TableCell><Select value={r.status || "applied"} onValueChange={v => updateStatus.mutate({ id: r.id, status: v })}><SelectTrigger className="h-7 w-28"><Badge variant={statusColor[r.status || "applied"] as any} className="capitalize">{r.status}</Badge></SelectTrigger><SelectContent>{APP_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end">
                    {r.status === "offer" && <Button size="sm" variant="outline" onClick={() => hireApplicant.mutate(r)} title="Hire & add to employees"><UserCheck className="w-3.5 h-3.5 mr-1" />Hire</Button>}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div></TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Applicants</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
