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
import { Plus, BookOpen, Pencil, Trash2, Loader2 } from "lucide-react";
import EducaAdvancedSearch, { FilterField } from "@/components/educa/EducaAdvancedSearch";

const LEVELS = ["diploma", "bachelors", "masters", "phd", "certificate", "foundation"];
const emptyForm = { course_name: "", course_code: "", university_id: "", level: "bachelors", duration: "", tuition_fee: "0", currency: "USD", intake: "", ielts_requirement: "", entry_requirements: "", description: "" };

const FILTER_FIELDS: FilterField[] = [
  { key: "level", label: "Level", type: "select", options: LEVELS.map(l => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) })) },
  { key: "currency", label: "Currency", type: "select", options: ["USD", "AUD", "GBP", "CAD", "EUR"].map(c => ({ value: c, label: c })) },
  { key: "min_fee", label: "Min Fee", type: "number", placeholder: "0" },
  { key: "max_fee", label: "Max Fee", type: "number", placeholder: "100000" },
  { key: "max_ielts", label: "Max IELTS Req", type: "number", placeholder: "9.0" },
  { key: "intake", label: "Intake", type: "text", placeholder: "e.g. Sep" },
];

export default function EducaCoursesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["educa_courses"], queryFn: async () => { const { data, error } = await supabase.from("educa_courses").select("*, educa_universities(name, country)").order("course_name"); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const { data: universities } = useQuery({
    queryKey: ["educa_unis_list"], queryFn: async () => { const { data } = await supabase.from("educa_universities").select("id, name").eq("is_active", true).order("name"); return data ?? []; }, enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { course_name: form.course_name, course_code: form.course_code || null, university_id: form.university_id || null, level: form.level, duration: form.duration || null, tuition_fee: parseFloat(form.tuition_fee) || 0, currency: form.currency, intake: form.intake || null, ielts_requirement: form.ielts_requirement ? parseFloat(form.ielts_requirement) : null, entry_requirements: form.entry_requirements || null, description: form.description || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("educa_courses").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("educa_courses").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_courses"] }); toast({ title: editId ? "Course updated" : "Course added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_courses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_courses"] }); toast({ title: "Course deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (c: any) => { setEditId(c.id); setForm({ course_name: c.course_name, course_code: c.course_code || "", university_id: c.university_id || "", level: c.level || "bachelors", duration: c.duration || "", tuition_fee: c.tuition_fee?.toString() || "0", currency: c.currency || "USD", intake: c.intake || "", ielts_requirement: c.ielts_requirement?.toString() || "", entry_requirements: c.entry_requirements || "", description: c.description || "" }); setOpen(true); };

  const filtered = (courses ?? []).filter(c => {
    const q = search.toLowerCase();
    if (q && !c.course_name.toLowerCase().includes(q) && !(c.course_code || "").toLowerCase().includes(q) && !(c as any).educa_universities?.name?.toLowerCase().includes(q)) return false;
    if (filters.level && filters.level !== "all" && c.level !== filters.level) return false;
    if (filters.currency && filters.currency !== "all" && c.currency !== filters.currency) return false;
    if (filters.min_fee && (c.tuition_fee || 0) < parseFloat(filters.min_fee)) return false;
    if (filters.max_fee && (c.tuition_fee || 0) > parseFloat(filters.max_fee)) return false;
    if (filters.max_ielts && (c.ielts_requirement || 0) > parseFloat(filters.max_ielts)) return false;
    if (filters.intake && !(c.intake || "").toLowerCase().includes(filters.intake.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" /> Courses</h1><p className="text-muted-foreground">Manage course catalog · {filtered.length} results</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Add Course</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Edit Course" : "Add Course"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Course Name *</Label><Input value={form.course_name} onChange={e => setForm(p => ({ ...p, course_name: e.target.value }))} /></div>
                <div><Label>Course Code</Label><Input value={form.course_code} onChange={e => setForm(p => ({ ...p, course_code: e.target.value }))} /></div>
                <div><Label>University</Label><Select value={form.university_id} onValueChange={v => setForm(p => ({ ...p, university_id: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{(universities ?? []).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Level</Label><Select value={form.level} onValueChange={v => setForm(p => ({ ...p, level: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Duration</Label><Input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 2 years" /></div>
                <div><Label>Tuition Fee</Label><Input type="number" value={form.tuition_fee} onChange={e => setForm(p => ({ ...p, tuition_fee: e.target.value }))} /></div>
                <div><Label>Currency</Label><Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["USD", "AUD", "GBP", "CAD", "EUR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Intake</Label><Input value={form.intake} onChange={e => setForm(p => ({ ...p, intake: e.target.value }))} placeholder="e.g. Feb, Jul, Sep" /></div>
                <div><Label>IELTS Requirement</Label><Input type="number" step="0.5" value={form.ielts_requirement} onChange={e => setForm(p => ({ ...p, ielts_requirement: e.target.value }))} /></div>
                <div><Label>Entry Requirements</Label><Input value={form.entry_requirements} onChange={e => setForm(p => ({ ...p, entry_requirements: e.target.value }))} /></div>
                <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={!form.course_name || upsert.isPending}>{editId ? "Update" : "Add"}</Button></div>
            </DialogContent>
          </Dialog>
        </div>

        <EducaAdvancedSearch module="courses" fields={FILTER_FIELDS} filters={filters} onFiltersChange={setFilters} search={search} onSearchChange={setSearch} />

        <Card><CardContent className="p-0">
          {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No courses found</div> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Course</TableHead><TableHead>University</TableHead><TableHead>Level</TableHead><TableHead>Duration</TableHead><TableHead>Fee</TableHead><TableHead>Intake</TableHead><TableHead>IELTS</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(c => (
                <TableRow key={c.id}><TableCell className="font-medium">{c.course_name}<br /><span className="text-xs text-muted-foreground">{c.course_code}</span></TableCell><TableCell className="text-sm">{(c as any).educa_universities?.name || "—"}</TableCell><TableCell className="capitalize text-sm">{c.level}</TableCell><TableCell className="text-sm">{c.duration || "—"}</TableCell><TableCell className="text-sm">{c.currency} {c.tuition_fee?.toLocaleString()}</TableCell><TableCell className="text-sm">{c.intake || "—"}</TableCell><TableCell className="text-sm">{c.ielts_requirement ?? "—"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>
              ))}</TableBody></Table></div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
