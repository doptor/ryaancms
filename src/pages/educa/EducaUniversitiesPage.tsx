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
import { Plus, Building2, Pencil, Trash2, Loader2 } from "lucide-react";
import EducaAdvancedSearch, { FilterField } from "@/components/educa/EducaAdvancedSearch";

const emptyForm = { name: "", country: "", city: "", website: "", contact_person: "", contact_email: "", contact_phone: "", commission_rate: "15", ranking: "", type: "public", partnership_status: "active", notes: "" };

const FILTER_FIELDS: FilterField[] = [
  { key: "partnership_status", label: "Partnership", type: "select", options: [{ value: "active", label: "Active" }, { value: "pending", label: "Pending" }, { value: "inactive", label: "Inactive" }] },
  { key: "type", label: "Type", type: "select", options: [{ value: "public", label: "Public" }, { value: "private", label: "Private" }, { value: "college", label: "College" }] },
  { key: "country", label: "Country", type: "text", placeholder: "e.g. Australia" },
  { key: "min_commission", label: "Min Commission %", type: "number", placeholder: "0" },
];

export default function EducaUniversitiesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);

  const { data: universities, isLoading } = useQuery({
    queryKey: ["educa_universities"], queryFn: async () => { const { data, error } = await supabase.from("educa_universities").select("*").order("name"); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, country: form.country || null, city: form.city || null, website: form.website || null, contact_person: form.contact_person || null, contact_email: form.contact_email || null, contact_phone: form.contact_phone || null, commission_rate: parseFloat(form.commission_rate) || 0, ranking: form.ranking ? parseInt(form.ranking) : null, type: form.type, partnership_status: form.partnership_status, notes: form.notes || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("educa_universities").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("educa_universities").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_universities"] }); toast({ title: editId ? "University updated" : "University added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_universities").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_universities"] }); toast({ title: "University deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (u: any) => { setEditId(u.id); setForm({ name: u.name, country: u.country || "", city: u.city || "", website: u.website || "", contact_person: u.contact_person || "", contact_email: u.contact_email || "", contact_phone: u.contact_phone || "", commission_rate: u.commission_rate?.toString() || "15", ranking: u.ranking?.toString() || "", type: u.type || "public", partnership_status: u.partnership_status || "active", notes: u.notes || "" }); setOpen(true); };

  const filtered = (universities ?? []).filter(u => {
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !(u.country || "").toLowerCase().includes(q) && !(u.city || "").toLowerCase().includes(q)) return false;
    if (filters.partnership_status && filters.partnership_status !== "all" && u.partnership_status !== filters.partnership_status) return false;
    if (filters.type && filters.type !== "all" && u.type !== filters.type) return false;
    if (filters.country && !(u.country || "").toLowerCase().includes(filters.country.toLowerCase())) return false;
    if (filters.min_commission && (u.commission_rate || 0) < parseFloat(filters.min_commission)) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-primary" /> Universities</h1><p className="text-muted-foreground">Manage partner institutions · {filtered.length} results</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Add University</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Edit University" : "Add University"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Country</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
                <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." /></div>
                <div><Label>Contact Person</Label><Input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} /></div>
                <div><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
                <div><Label>Contact Phone</Label><Input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} /></div>
                <div><Label>Commission Rate (%)</Label><Input type="number" value={form.commission_rate} onChange={e => setForm(p => ({ ...p, commission_rate: e.target.value }))} /></div>
                <div><Label>Ranking</Label><Input type="number" value={form.ranking} onChange={e => setForm(p => ({ ...p, ranking: e.target.value }))} /></div>
                <div><Label>Type</Label><Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem><SelectItem value="college">College</SelectItem></SelectContent></Select></div>
                <div><Label>Partnership</Label><Select value={form.partnership_status} onValueChange={v => setForm(p => ({ ...p, partnership_status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
                <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending}>{editId ? "Update" : "Add"}</Button></div>
            </DialogContent>
          </Dialog>
        </div>

        <EducaAdvancedSearch module="universities" fields={FILTER_FIELDS} filters={filters} onFiltersChange={setFilters} search={search} onSearchChange={setSearch} />

        <Card><CardContent className="p-0">
          {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No universities found</div> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Country</TableHead><TableHead>City</TableHead><TableHead>Type</TableHead><TableHead>Commission</TableHead><TableHead>Ranking</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(u => (
                <TableRow key={u.id}><TableCell className="font-medium">{u.name}</TableCell><TableCell>{u.country || "—"}</TableCell><TableCell>{u.city || "—"}</TableCell><TableCell className="capitalize">{u.type}</TableCell><TableCell>{u.commission_rate}%</TableCell><TableCell>{u.ranking || "—"}</TableCell><TableCell><Badge variant={u.partnership_status === "active" ? "secondary" : "outline"} className="capitalize text-xs">{u.partnership_status}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(u.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>
              ))}</TableBody></Table></div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
