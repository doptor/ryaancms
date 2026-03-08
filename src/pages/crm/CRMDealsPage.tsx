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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Target, Plus, DollarSign, Pencil, Trash2, Search, FileText } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["open", "won", "lost"];
const statusColor: Record<string, string> = { open: "bg-blue-100 text-blue-700", won: "bg-green-100 text-green-700", lost: "bg-red-100 text-red-700" };

const emptyForm = { title: "", value: "", expected_close_date: "", notes: "", company_id: "", contact_id: "", status: "open" };

export default function CRMDealsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: deals, isLoading } = useQuery({
    queryKey: ["crm-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_deals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: companies } = useQuery({
    queryKey: ["crm-companies-list"],
    queryFn: async () => { const { data } = await supabase.from("crm_companies").select("id, name"); return data ?? []; },
    enabled: !!user,
  });

  const { data: contacts } = useQuery({
    queryKey: ["crm-contacts-list"],
    queryFn: async () => { const { data } = await supabase.from("crm_contacts").select("id, name"); return data ?? []; },
    enabled: !!user,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title, value: parseFloat(form.value) || 0, expected_close_date: form.expected_close_date || null,
        notes: form.notes, company_id: form.company_id || null, contact_id: form.contact_id || null, status: form.status,
      };
      if (editId) {
        const { error } = await supabase.from("crm_deals").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crm_deals").insert({ ...payload, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-deals"] });
      toast({ title: editId ? "Deal updated" : "Deal created" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("crm_deals").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-deals"] }); toast({ title: "Deal deleted" }); },
  });

  const resetForm = () => { setForm(emptyForm); setEditId(null); setOpen(false); };

  const openEdit = (d: any) => {
    setForm({ title: d.title, value: d.value?.toString() || "", expected_close_date: d.expected_close_date || "", notes: d.notes || "", company_id: d.company_id || "", contact_id: d.contact_id || "", status: d.status || "open" });
    setEditId(d.id); setOpen(true);
  };

  const totalValue = (deals ?? []).reduce((s, d) => s + Number(d.value ?? 0), 0);
  const wonValue = (deals ?? []).filter(d => d.status === "won").reduce((s, d) => s + Number(d.value ?? 0), 0);
  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  const getCompanyName = (id: string | null) => (companies ?? []).find(c => c.id === id)?.name || "";
  const getContactName = (id: string | null) => (contacts ?? []).find(c => c.id === id)?.name || "";

  const filtered = (deals ?? []).filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6 text-primary" /> Deals</h1>
            <p className="text-muted-foreground">Sales pipeline & opportunities</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Deal</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Deal" : "Create Deal"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Value ($)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
                  <div><Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Expected Close Date</Label><Input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Company</Label>
                    <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {(companies ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Contact</Label>
                    <Select value={form.contact_id} onValueChange={(v) => setForm({ ...form, contact_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {(contacts ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                <Button onClick={() => upsertMutation.mutate()} disabled={!form.title.trim()} className="w-full">
                  {editId ? "Update Deal" : "Create Deal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Pipeline</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(totalValue)}</div><p className="text-xs text-muted-foreground">{(deals ?? []).length} deals</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Won Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{fmt(wonValue)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Open Deals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(deals ?? []).filter(d => d.status === "open").length}</div></CardContent></Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3">
          {filtered.map((d) => (
            <Card key={d.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-muted"><DollarSign className="w-5 h-5 text-primary" /></div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{d.title}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                      {getCompanyName(d.company_id) && <span>🏢 {getCompanyName(d.company_id)}</span>}
                      {getContactName(d.contact_id) && <span>👤 {getContactName(d.contact_id)}</span>}
                      {d.expected_close_date && <span>📅 {d.expected_close_date}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold">{fmt(Number(d.value ?? 0))}</span>
                  <Badge variant="outline" className={statusColor[d.status ?? "open"]}>{d.status}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && !isLoading && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No deals found.</CardContent></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
