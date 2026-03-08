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
import { Plus, TrendingUp, Pencil, Trash2, Loader2, UserPlus } from "lucide-react";
import EducaAdvancedSearch, { FilterField } from "@/components/educa/EducaAdvancedSearch";

const STATUSES = ["new", "contacted", "qualified", "converted", "lost"];
const SOURCES = ["website", "social_media", "agent", "referral", "marketing", "walk_in", "other"];
const emptyForm = { name: "", email: "", phone: "", nationality: "", preferred_country: "", preferred_level: "", source: "website", status: "new", score: "0", notes: "" };

const FILTER_FIELDS: FilterField[] = [
  { key: "status", label: "Status", type: "select", options: STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })) },
  { key: "source", label: "Source", type: "select", options: SOURCES.map(s => ({ value: s, label: s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) })) },
  { key: "min_score", label: "Min Score", type: "number", placeholder: "0" },
  { key: "preferred_country", label: "Country", type: "text", placeholder: "e.g. Australia" },
  { key: "date_from", label: "Created After", type: "date" },
];

export default function EducaLeadsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["educa_leads"], queryFn: async () => { const { data, error } = await supabase.from("educa_leads").select("*").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, email: form.email || null, phone: form.phone || null, nationality: form.nationality || null, preferred_country: form.preferred_country || null, preferred_level: form.preferred_level || null, source: form.source, status: form.status, score: parseInt(form.score) || 0, notes: form.notes || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("educa_leads").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("educa_leads").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_leads"] }); toast({ title: editId ? "Lead updated" : "Lead added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const convertToStudent = useMutation({
    mutationFn: async (lead: any) => {
      const { data: student, error: sErr } = await supabase.from("educa_students").insert({ name: lead.name, email: lead.email, phone: lead.phone, nationality: lead.nationality, preferred_country: lead.preferred_country, education_level: lead.preferred_level || "bachelors", source: "lead", user_id: user!.id }).select().single();
      if (sErr) throw sErr;
      const { error: lErr } = await supabase.from("educa_leads").update({ status: "converted", converted_student_id: student.id, converted_at: new Date().toISOString() }).eq("id", lead.id);
      if (lErr) throw lErr;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_leads"] }); qc.invalidateQueries({ queryKey: ["educa_students"] }); toast({ title: "Lead converted to student!" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_leads").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_leads"] }); toast({ title: "Lead deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (l: any) => { setEditId(l.id); setForm({ name: l.name, email: l.email || "", phone: l.phone || "", nationality: l.nationality || "", preferred_country: l.preferred_country || "", preferred_level: l.preferred_level || "", source: l.source || "website", status: l.status || "new", score: l.score?.toString() || "0", notes: l.notes || "" }); setOpen(true); };

  const filtered = (leads ?? []).filter(l => {
    const q = search.toLowerCase();
    if (q && !l.name.toLowerCase().includes(q) && !(l.email || "").toLowerCase().includes(q) && !(l.phone || "").includes(q)) return false;
    if (filters.status && filters.status !== "all" && l.status !== filters.status) return false;
    if (filters.source && filters.source !== "all" && l.source !== filters.source) return false;
    if (filters.min_score && (l.score || 0) < parseInt(filters.min_score)) return false;
    if (filters.preferred_country && !(l.preferred_country || "").toLowerCase().includes(filters.preferred_country.toLowerCase())) return false;
    if (filters.date_from && new Date(l.created_at) < new Date(filters.date_from)) return false;
    return true;
  });

  const statusColor = (s: string) => s === "converted" ? "default" : s === "qualified" ? "secondary" : s === "lost" ? "destructive" : "outline";

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6 text-primary" /> Leads</h1><p className="text-muted-foreground">CRM lead management · {filtered.length} results</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Add Lead</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Lead" : "Add Lead"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>Nationality</Label><Input value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} /></div>
                <div><Label>Preferred Country</Label><Input value={form.preferred_country} onChange={e => setForm(p => ({ ...p, preferred_country: e.target.value }))} /></div>
                <div><Label>Preferred Level</Label><Select value={form.preferred_level} onValueChange={v => setForm(p => ({ ...p, preferred_level: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{["bachelors", "masters", "phd", "diploma"].map(l => <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Source</Label><Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Score (0-100)</Label><Input type="number" value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} min="0" max="100" /></div>
                <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending}>{editId ? "Update" : "Add"}</Button></div>
            </DialogContent>
          </Dialog>
        </div>

        <EducaAdvancedSearch module="leads" fields={FILTER_FIELDS} filters={filters} onFiltersChange={setFilters} search={search} onSearchChange={setSearch} />

        <Card><CardContent className="p-0">
          {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No leads found</div> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Country</TableHead><TableHead>Source</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(l => (
                <TableRow key={l.id}><TableCell className="font-medium">{l.name}</TableCell><TableCell className="text-sm">{l.email || "—"}</TableCell><TableCell className="text-sm">{l.preferred_country || "—"}</TableCell><TableCell className="text-sm capitalize">{(l.source || "").replace(/_/g, " ")}</TableCell><TableCell><Badge variant="outline" className="text-xs">{l.score}</Badge></TableCell><TableCell><Badge variant={statusColor(l.status || "") as any} className="capitalize text-xs">{l.status}</Badge></TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {l.status !== "converted" && <Button variant="ghost" size="icon" title="Convert to student" onClick={() => convertToStudent.mutate(l)}><UserPlus className="w-4 h-4 text-green-600" /></Button>}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(l.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell></TableRow>
              ))}</TableBody></Table></div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
