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
import { Plus, GraduationCap, Pencil, Trash2, Loader2 } from "lucide-react";
import EducaAdvancedSearch, { FilterField } from "@/components/educa/EducaAdvancedSearch";

const STATUSES = ["active", "inactive", "graduated", "withdrawn"];
const LEVELS = ["high_school", "bachelors", "masters", "phd", "diploma"];
const COUNTRIES = ["Australia", "UK", "Canada", "USA", "Germany", "Ireland", "New Zealand", "Netherlands", "Sweden", "Other"];
const emptyForm = { name: "", email: "", phone: "", dob: "", nationality: "", passport_number: "", education_level: "bachelors", ielts_score: "", toefl_score: "", pte_score: "", preferred_country: "", preferred_intake: "", address: "", city: "", country: "", notes: "", status: "active", source: "direct" };

const FILTER_FIELDS: FilterField[] = [
  { key: "status", label: "Status", type: "select", options: STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })) },
  { key: "preferred_country", label: "Destination", type: "select", options: COUNTRIES.map(c => ({ value: c, label: c })) },
  { key: "education_level", label: "Education Level", type: "select", options: LEVELS.map(l => ({ value: l, label: l.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) })) },
  { key: "source", label: "Source", type: "select", options: ["direct", "agent", "website", "referral", "social_media"].map(s => ({ value: s, label: s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) })) },
  { key: "ielts_min", label: "Min IELTS", type: "number", placeholder: "e.g. 6.5" },
  { key: "nationality", label: "Nationality", type: "text", placeholder: "e.g. Indian" },
  { key: "date_from", label: "Added After", type: "date" },
  { key: "date_to", label: "Added Before", type: "date" },
];

export default function EducaStudentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);

  const { data: students, isLoading } = useQuery({
    queryKey: ["educa_students"], queryFn: async () => { const { data, error } = await supabase.from("educa_students").select("*").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form, ielts_score: form.ielts_score ? parseFloat(form.ielts_score) : null, toefl_score: form.toefl_score ? parseFloat(form.toefl_score) : null, pte_score: form.pte_score ? parseFloat(form.pte_score) : null, dob: form.dob || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("educa_students").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("educa_students").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_students"] }); toast({ title: editId ? "Student updated" : "Student added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_students").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_students"] }); toast({ title: "Student deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ name: s.name, email: s.email || "", phone: s.phone || "", dob: s.dob || "", nationality: s.nationality || "", passport_number: s.passport_number || "", education_level: s.education_level || "bachelors", ielts_score: s.ielts_score?.toString() || "", toefl_score: s.toefl_score?.toString() || "", pte_score: s.pte_score?.toString() || "", preferred_country: s.preferred_country || "", preferred_intake: s.preferred_intake || "", address: s.address || "", city: s.city || "", country: s.country || "", notes: s.notes || "", status: s.status || "active", source: s.source || "direct" });
    setOpen(true);
  };

  const filtered = (students ?? []).filter(s => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !(s.email || "").toLowerCase().includes(q) && !(s.nationality || "").toLowerCase().includes(q)) return false;
    if (filters.status && filters.status !== "all" && s.status !== filters.status) return false;
    if (filters.preferred_country && filters.preferred_country !== "all" && s.preferred_country !== filters.preferred_country) return false;
    if (filters.education_level && filters.education_level !== "all" && s.education_level !== filters.education_level) return false;
    if (filters.source && filters.source !== "all" && s.source !== filters.source) return false;
    if (filters.ielts_min && (s.ielts_score || 0) < parseFloat(filters.ielts_min)) return false;
    if (filters.nationality && !(s.nationality || "").toLowerCase().includes(filters.nationality.toLowerCase())) return false;
    if (filters.date_from && new Date(s.created_at) < new Date(filters.date_from)) return false;
    if (filters.date_to && new Date(s.created_at) > new Date(filters.date_to)) return false;
    return true;
  });

  const statusColor = (s: string) => s === "active" ? "secondary" : s === "graduated" ? "default" : "outline";

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6 text-primary" /> Students</h1><p className="text-muted-foreground">Manage student profiles · {filtered.length} results</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Add Student</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Edit Student" : "Add Student"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>Date of Birth</Label><Input type="date" value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} /></div>
                <div><Label>Nationality</Label><Input value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} /></div>
                <div><Label>Passport No.</Label><Input value={form.passport_number} onChange={e => setForm(p => ({ ...p, passport_number: e.target.value }))} /></div>
                <div><Label>Education Level</Label><Select value={form.education_level} onValueChange={v => setForm(p => ({ ...p, education_level: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Preferred Country</Label><Select value={form.preferred_country} onValueChange={v => setForm(p => ({ ...p, preferred_country: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>IELTS Score</Label><Input type="number" step="0.5" value={form.ielts_score} onChange={e => setForm(p => ({ ...p, ielts_score: e.target.value }))} /></div>
                <div><Label>TOEFL Score</Label><Input type="number" value={form.toefl_score} onChange={e => setForm(p => ({ ...p, toefl_score: e.target.value }))} /></div>
                <div><Label>PTE Score</Label><Input type="number" value={form.pte_score} onChange={e => setForm(p => ({ ...p, pte_score: e.target.value }))} /></div>
                <div><Label>Preferred Intake</Label><Input value={form.preferred_intake} onChange={e => setForm(p => ({ ...p, preferred_intake: e.target.value }))} placeholder="e.g. Sep 2026" /></div>
                <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Source</Label><Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["direct", "agent", "website", "referral", "social_media"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}</SelectContent></Select></div>
                <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending}>{upsert.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}{editId ? "Update" : "Add"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <EducaAdvancedSearch module="students" fields={FILTER_FIELDS} filters={filters} onFiltersChange={setFilters} search={search} onSearchChange={setSearch} />

        <Card>
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No students found</div> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Nationality</TableHead><TableHead>Preferred Country</TableHead><TableHead>Education</TableHead><TableHead>IELTS</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filtered.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-sm">{s.email || "—"}</TableCell>
                        <TableCell className="text-sm">{s.nationality || "—"}</TableCell>
                        <TableCell className="text-sm">{s.preferred_country || "—"}</TableCell>
                        <TableCell className="text-sm capitalize">{(s.education_level || "").replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-sm">{s.ielts_score ?? "—"}</TableCell>
                        <TableCell><Badge variant={statusColor(s.status || "")} className="capitalize text-xs">{s.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
