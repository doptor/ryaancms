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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Star, Search, Pencil, Trash2, Loader2, Award, BarChart3 } from "lucide-react";
import { format } from "date-fns";

const REVIEW_STATUSES = ["draft", "in_progress", "completed"];
const emptyForm = { employee_id: "", cycle_id: "", review_date: format(new Date(), "yyyy-MM-dd"), overall_rating: "3", goals: "", achievements: "", areas_of_improvement: "", reviewer_comments: "", employee_comments: "" };
const emptyCycleForm = { name: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "" };

export default function HRPerformancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [cycleForm, setCycleForm] = useState(emptyCycleForm);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["hr_performance_reviews"], queryFn: async () => { const { data, error } = await supabase.from("hr_performance_reviews").select("*, hr_employees(name, employee_id), hr_review_cycles(name)").order("review_date", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: employees } = useQuery({ queryKey: ["hr_emp_perf"], queryFn: async () => { const { data } = await supabase.from("hr_employees").select("id, name, employee_id").eq("status", "active"); return data ?? []; }, enabled: !!user });
  const { data: cycles } = useQuery({ queryKey: ["hr_review_cycles"], queryFn: async () => { const { data } = await supabase.from("hr_review_cycles").select("*").order("start_date", { ascending: false }); return data ?? []; }, enabled: !!user });

  const upsertReview = useMutation({
    mutationFn: async () => {
      const payload: any = { employee_id: form.employee_id, cycle_id: form.cycle_id || null, review_date: form.review_date, overall_rating: parseInt(form.overall_rating) || 0, goals: form.goals || null, achievements: form.achievements || null, areas_of_improvement: form.areas_of_improvement || null, reviewer_comments: form.reviewer_comments || null, employee_comments: form.employee_comments || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("hr_performance_reviews").update(payload).eq("id", editId); if (error) throw error; }
      else { payload.status = "draft"; const { error } = await supabase.from("hr_performance_reviews").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_performance_reviews"] }); toast({ title: editId ? "Review updated" : "Review created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createCycle = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("hr_review_cycles").insert({ ...cycleForm, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_review_cycles"] }); toast({ title: "Review cycle created" }); setCycleOpen(false); setCycleForm(emptyCycleForm); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from("hr_performance_reviews").update({ status }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_performance_reviews"] }); toast({ title: "Status updated" }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_performance_reviews").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_performance_reviews"] }); toast({ title: "Review deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => { setEditId(r.id); setForm({ employee_id: r.employee_id, cycle_id: r.cycle_id || "", review_date: r.review_date, overall_rating: String(r.overall_rating ?? 3), goals: r.goals || "", achievements: r.achievements || "", areas_of_improvement: r.areas_of_improvement || "", reviewer_comments: r.reviewer_comments || "", employee_comments: r.employee_comments || "" }); setOpen(true); };

  const filtered = (reviews ?? []).filter(r => { const q = search.toLowerCase(); return !q || (r.hr_employees?.name || "").toLowerCase().includes(q); });
  const avgRating = filtered.length > 0 ? (filtered.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / filtered.length).toFixed(1) : "0";

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Award className="w-6 h-6 text-primary" /> Performance Reviews</h1><p className="text-muted-foreground">Employee appraisals, goals & ratings</p></div>
          <div className="flex gap-2">
            <Dialog open={cycleOpen} onOpenChange={v => { setCycleOpen(v); if (!v) setCycleForm(emptyCycleForm); }}>
              <DialogTrigger asChild><Button variant="outline"><BarChart3 className="w-4 h-4 mr-2" />Review Cycles</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Review Cycles</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  {(cycles ?? []).map(c => <div key={c.id} className="flex justify-between items-center p-2 border rounded"><span className="font-medium">{c.name}</span><Badge variant={c.status === "active" ? "secondary" : "outline"}>{c.status}</Badge></div>)}
                  <div className="border-t pt-3 space-y-2">
                    <Input placeholder="Cycle name" value={cycleForm.name} onChange={e => setCycleForm({ ...cycleForm, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={cycleForm.start_date} onChange={e => setCycleForm({ ...cycleForm, start_date: e.target.value })} />
                      <Input type="date" value={cycleForm.end_date} onChange={e => setCycleForm({ ...cycleForm, end_date: e.target.value })} />
                    </div>
                    <Button size="sm" onClick={() => createCycle.mutate()} disabled={!cycleForm.name.trim() || !cycleForm.end_date} className="w-full">Create Cycle</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Review</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editId ? "Edit Review" : "New Performance Review"}</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Employee *</Label><Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(employees ?? []).map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Review Cycle</Label><Select value={form.cycle_id} onValueChange={v => setForm({ ...form, cycle_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="">None</SelectItem>{(cycles ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Review Date</Label><Input type="date" value={form.review_date} onChange={e => setForm({ ...form, review_date: e.target.value })} /></div>
                    <div><Label>Overall Rating (1-5)</Label><Input type="number" min="1" max="5" value={form.overall_rating} onChange={e => setForm({ ...form, overall_rating: e.target.value })} /></div>
                  </div>
                  <div><Label>Goals & Objectives</Label><Textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} rows={2} /></div>
                  <div><Label>Achievements</Label><Textarea value={form.achievements} onChange={e => setForm({ ...form, achievements: e.target.value })} rows={2} /></div>
                  <div><Label>Areas of Improvement</Label><Textarea value={form.areas_of_improvement} onChange={e => setForm({ ...form, areas_of_improvement: e.target.value })} rows={2} /></div>
                  <div><Label>Reviewer Comments</Label><Textarea value={form.reviewer_comments} onChange={e => setForm({ ...form, reviewer_comments: e.target.value })} rows={2} /></div>
                  <div><Label>Employee Comments</Label><Textarea value={form.employee_comments} onChange={e => setForm({ ...form, employee_comments: e.target.value })} rows={2} /></div>
                  <Button onClick={() => upsertReview.mutate()} disabled={!form.employee_id} className="w-full">{editId ? "Update" : "Create"} Review</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(reviews ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-1">{avgRating}<Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{(reviews ?? []).filter(r => r.status === "completed").length}</div></CardContent></Card>
        </div>

        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Cycle</TableHead><TableHead>Date</TableHead><TableHead>Rating</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.hr_employees?.name}</TableCell>
                  <TableCell>{r.hr_review_cycles?.name || "—"}</TableCell>
                  <TableCell>{format(new Date(r.review_date), "MMM dd, yyyy")}</TableCell>
                  <TableCell><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < (r.overall_rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />)}</div></TableCell>
                  <TableCell><Select value={r.status || "draft"} onValueChange={v => updateStatus.mutate({ id: r.id, status: v })}><SelectTrigger className="h-7 w-28"><Badge variant={r.status === "completed" ? "secondary" : "outline"} className="capitalize">{r.status}</Badge></SelectTrigger><SelectContent>{REVIEW_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end"><Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div></TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><Award className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Performance Reviews</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
