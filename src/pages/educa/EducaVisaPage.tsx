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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Plane, Pencil, Trash2, Loader2 } from "lucide-react";
import EducaAdvancedSearch, { FilterField } from "@/components/educa/EducaAdvancedSearch";

const VISA_STATUSES = ["not_started", "documents_collecting", "submitted", "interview_scheduled", "interview_done", "approved", "rejected"];
const emptyForm = { student_id: "", application_id: "", country: "", visa_type: "student", status: "not_started", submission_date: "", interview_date: "", decision_date: "", expiry_date: "", reference_number: "", documents_complete: false, notes: "" };

const FILTER_FIELDS: FilterField[] = [
  { key: "status", label: "Status", type: "select", options: VISA_STATUSES.map(s => ({ value: s, label: s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) })) },
  { key: "visa_type", label: "Visa Type", type: "select", options: [{ value: "student", label: "Student" }, { value: "work", label: "Work" }, { value: "tourist", label: "Tourist" }, { value: "dependent", label: "Dependent" }] },
  { key: "country", label: "Country", type: "text", placeholder: "e.g. Australia" },
  { key: "docs_complete", label: "Docs Complete", type: "select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
  { key: "interview_after", label: "Interview After", type: "date" },
];

export default function EducaVisaPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);

  const { data: visas, isLoading } = useQuery({
    queryKey: ["educa_visa"], queryFn: async () => { const { data, error } = await supabase.from("educa_visa").select("*, educa_students(name)").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const { data: students } = useQuery({ queryKey: ["educa_students_sel"], queryFn: async () => { const { data } = await supabase.from("educa_students").select("id, name").order("name"); return data ?? []; }, enabled: !!user });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { student_id: form.student_id || null, application_id: form.application_id || null, country: form.country || null, visa_type: form.visa_type, status: form.status, submission_date: form.submission_date || null, interview_date: form.interview_date || null, decision_date: form.decision_date || null, expiry_date: form.expiry_date || null, reference_number: form.reference_number || null, documents_complete: form.documents_complete, notes: form.notes || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("educa_visa").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("educa_visa").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_visa"] }); toast({ title: editId ? "Visa updated" : "Visa record created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_visa").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_visa"] }); toast({ title: "Visa record deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (v: any) => { setEditId(v.id); setForm({ student_id: v.student_id || "", application_id: v.application_id || "", country: v.country || "", visa_type: v.visa_type || "student", status: v.status || "not_started", submission_date: v.submission_date || "", interview_date: v.interview_date ? v.interview_date.split("T")[0] : "", decision_date: v.decision_date || "", expiry_date: v.expiry_date || "", reference_number: v.reference_number || "", documents_complete: v.documents_complete || false, notes: v.notes || "" }); setOpen(true); };

  const filtered = (visas ?? []).filter(v => {
    const q = search.toLowerCase();
    if (q && !(v as any).educa_students?.name?.toLowerCase().includes(q) && !(v.country || "").toLowerCase().includes(q) && !(v.reference_number || "").toLowerCase().includes(q)) return false;
    if (filters.status && filters.status !== "all" && v.status !== filters.status) return false;
    if (filters.visa_type && filters.visa_type !== "all" && v.visa_type !== filters.visa_type) return false;
    if (filters.country && !(v.country || "").toLowerCase().includes(filters.country.toLowerCase())) return false;
    if (filters.docs_complete === "yes" && !v.documents_complete) return false;
    if (filters.docs_complete === "no" && v.documents_complete) return false;
    if (filters.interview_after && v.interview_date && new Date(v.interview_date) < new Date(filters.interview_after)) return false;
    return true;
  });

  const statusColor = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : s === "submitted" || s === "interview_scheduled" ? "secondary" : "outline";

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Plane className="w-6 h-6 text-primary" /> Visa Processing</h1><p className="text-muted-foreground">Track visa applications · {filtered.length} results</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Add Visa</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Edit Visa" : "Add Visa Record"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Student</Label><Select value={form.student_id} onValueChange={v => setForm(p => ({ ...p, student_id: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{(students ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Country</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
                <div><Label>Visa Type</Label><Select value={form.visa_type} onValueChange={v => setForm(p => ({ ...p, visa_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="work">Work</SelectItem><SelectItem value="tourist">Tourist</SelectItem><SelectItem value="dependent">Dependent</SelectItem></SelectContent></Select></div>
                <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VISA_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Submission Date</Label><Input type="date" value={form.submission_date} onChange={e => setForm(p => ({ ...p, submission_date: e.target.value }))} /></div>
                <div><Label>Interview Date</Label><Input type="date" value={form.interview_date} onChange={e => setForm(p => ({ ...p, interview_date: e.target.value }))} /></div>
                <div><Label>Decision Date</Label><Input type="date" value={form.decision_date} onChange={e => setForm(p => ({ ...p, decision_date: e.target.value }))} /></div>
                <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} /></div>
                <div><Label>Reference Number</Label><Input value={form.reference_number} onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))} /></div>
                <div className="flex items-center gap-2"><Label>Documents Complete</Label><Switch checked={form.documents_complete} onCheckedChange={v => setForm(p => ({ ...p, documents_complete: v }))} /></div>
                <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>{editId ? "Update" : "Create"}</Button></div>
            </DialogContent>
          </Dialog>
        </div>

        <EducaAdvancedSearch module="visa" fields={FILTER_FIELDS} filters={filters} onFiltersChange={setFilters} search={search} onSearchChange={setSearch} />

        <Card><CardContent className="p-0">
          {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No visa records found</div> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Country</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Docs</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(v => (
                <TableRow key={v.id}><TableCell className="font-medium">{(v as any).educa_students?.name || "—"}</TableCell><TableCell>{v.country || "—"}</TableCell><TableCell className="capitalize">{v.visa_type}</TableCell><TableCell><Badge variant={statusColor(v.status || "") as any} className="capitalize text-xs">{(v.status || "").replace(/_/g, " ")}</Badge></TableCell><TableCell>{v.documents_complete ? <Badge variant="secondary" className="text-xs">✓ Complete</Badge> : <Badge variant="outline" className="text-xs">Incomplete</Badge>}</TableCell><TableCell className="text-sm">{v.reference_number || "—"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(v.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>
              ))}</TableBody></Table></div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
