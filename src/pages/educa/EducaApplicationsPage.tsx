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
import { Plus, FileText, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

const APP_STATUSES = ["new", "submitted", "processing", "offer_received", "accepted", "rejected", "visa_processing", "enrolled"];
const statusColors: Record<string, string> = { new: "outline", submitted: "secondary", processing: "secondary", offer_received: "default", accepted: "default", rejected: "destructive", visa_processing: "secondary", enrolled: "default" };

export default function EducaApplicationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ student_id: "", course_id: "", status: "new", intake: "", tuition_fee: "0", scholarship_amount: "0", notes: "", priority: "medium" });

  const { data: applications, isLoading } = useQuery({
    queryKey: ["educa_applications"], queryFn: async () => { const { data, error } = await supabase.from("educa_applications").select("*, educa_students(name), educa_courses(course_name, educa_universities(name))").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const { data: students } = useQuery({ queryKey: ["educa_students_list"], queryFn: async () => { const { data } = await supabase.from("educa_students").select("id, name").order("name"); return data ?? []; }, enabled: !!user });
  const { data: courses } = useQuery({ queryKey: ["educa_courses_list"], queryFn: async () => { const { data } = await supabase.from("educa_courses").select("id, course_name, university_id, educa_universities(name)").order("course_name"); return data ?? []; }, enabled: !!user });

  const upsert = useMutation({
    mutationFn: async () => {
      const course = (courses ?? []).find(c => c.id === form.course_id);
      const payload: any = { student_id: form.student_id || null, course_id: form.course_id || null, university_id: course?.university_id || null, status: form.status, intake: form.intake || null, tuition_fee: parseFloat(form.tuition_fee) || 0, scholarship_amount: parseFloat(form.scholarship_amount) || 0, notes: form.notes || null, priority: form.priority, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("educa_applications").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("educa_applications").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_applications"] }); toast({ title: editId ? "Application updated" : "Application created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_applications").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_applications"] }); toast({ title: "Application deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm({ student_id: "", course_id: "", status: "new", intake: "", tuition_fee: "0", scholarship_amount: "0", notes: "", priority: "medium" }); };
  const openEdit = (a: any) => { setEditId(a.id); setForm({ student_id: a.student_id || "", course_id: a.course_id || "", status: a.status || "new", intake: a.intake || "", tuition_fee: a.tuition_fee?.toString() || "0", scholarship_amount: a.scholarship_amount?.toString() || "0", notes: a.notes || "", priority: a.priority || "medium" }); setOpen(true); };

  const filtered = (applications ?? []).filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || (a as any).educa_students?.name?.toLowerCase().includes(q) || (a as any).educa_courses?.course_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-primary" /> Applications</h1><p className="text-muted-foreground">Track student applications</p></div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-initial"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-48" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{APP_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}</SelectContent></Select>
            <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />New Application</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editId ? "Edit Application" : "New Application"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Student *</Label><Select value={form.student_id} onValueChange={v => setForm(p => ({ ...p, student_id: v }))}><SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger><SelectContent>{(students ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Course *</Label><Select value={form.course_id} onValueChange={v => setForm(p => ({ ...p, course_id: v }))}><SelectTrigger><SelectValue placeholder="Select course..." /></SelectTrigger><SelectContent>{(courses ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.course_name} – {(c as any).educa_universities?.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{APP_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Priority</Label><Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
                  <div><Label>Intake</Label><Input value={form.intake} onChange={e => setForm(p => ({ ...p, intake: e.target.value }))} placeholder="e.g. Sep 2026" /></div>
                  <div><Label>Tuition Fee</Label><Input type="number" value={form.tuition_fee} onChange={e => setForm(p => ({ ...p, tuition_fee: e.target.value }))} /></div>
                  <div><Label>Scholarship</Label><Input type="number" value={form.scholarship_amount} onChange={e => setForm(p => ({ ...p, scholarship_amount: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                </div>
                <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>{editId ? "Update" : "Create"}</Button></div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card><CardContent className="p-0">
          {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No applications found</div> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Course</TableHead><TableHead>University</TableHead><TableHead>Intake</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{(a as any).educa_students?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{(a as any).educa_courses?.course_name || "—"}</TableCell>
                  <TableCell className="text-sm">{(a as any).educa_courses?.educa_universities?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{a.intake || "—"}</TableCell>
                  <TableCell><Badge variant={(statusColors[a.status || ""] || "outline") as any} className="capitalize text-xs">{(a.status || "").replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell><Badge variant={a.priority === "urgent" ? "destructive" : a.priority === "high" ? "default" : "outline"} className="capitalize text-xs">{a.priority}</Badge></TableCell>
                  <TableCell className="text-sm">{a.application_date ? format(new Date(a.application_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}</TableBody></Table></div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
