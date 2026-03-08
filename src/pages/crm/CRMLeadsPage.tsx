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
import { UserPlus, Plus, Search, Pencil, Trash2, ArrowRightCircle } from "lucide-react";

const LEAD_SOURCES = ["manual", "website", "facebook", "google", "referral", "email", "other"];
const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

const statusColor: Record<string, string> = {
  new: "bg-blue-100 text-blue-700", contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-purple-100 text-purple-700", proposal: "bg-indigo-100 text-indigo-700",
  negotiation: "bg-amber-100 text-amber-700", won: "bg-green-100 text-green-700", lost: "bg-red-100 text-red-700",
};

const emptyForm = { name: "", email: "", phone: "", source: "manual", notes: "", website: "", address: "" };

export default function CRMLeadsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["crm-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("crm_leads").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crm_leads").insert({ ...form, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      toast({ title: editId ? "Lead updated" : "Lead created" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      toast({ title: "Lead deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("crm_leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      toast({ title: "Status updated" });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (lead: any) => {
      // Create contact from lead
      const { error: contactErr } = await supabase.from("crm_contacts").insert({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        notes: lead.notes,
        user_id: user!.id,
      });
      if (contactErr) throw contactErr;
      // Mark lead as converted
      const { error: leadErr } = await supabase.from("crm_leads").update({
        status: "won",
        converted_at: new Date().toISOString(),
      }).eq("id", lead.id);
      if (leadErr) throw leadErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      toast({ title: "Lead converted to contact!" });
      setConvertId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => { setForm(emptyForm); setEditId(null); setOpen(false); };

  const openEdit = (lead: any) => {
    setForm({ name: lead.name, email: lead.email || "", phone: lead.phone || "", source: lead.source || "manual", notes: lead.notes || "", website: lead.website || "", address: lead.address || "" });
    setEditId(lead.id);
    setOpen(true);
  };

  const filtered = (leads ?? []).filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || (l.email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    const matchSource = filterSource === "all" || l.source === filterSource;
    return matchSearch && matchStatus && matchSource;
  });

  const convertLead = convertId ? (leads ?? []).find(l => l.id === convertId) : null;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><UserPlus className="w-6 h-6 text-primary" /> Leads</h1>
            <p className="text-muted-foreground">Manage your sales prospects · {(leads ?? []).length} total</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Lead</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Lead" : "New Lead"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Source</Label>
                    <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
                </div>
                <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                <Button onClick={() => upsertMutation.mutate()} disabled={!form.name.trim()} className="w-full">
                  {editId ? "Update Lead" : "Create Lead"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.email || "—"}</TableCell>
                    <TableCell>{l.phone || "—"}</TableCell>
                    <TableCell className="capitalize">{l.source}</TableCell>
                    <TableCell>
                      <Select value={l.status ?? "new"} onValueChange={(v) => updateStatus.mutate({ id: l.id, status: v })}>
                        <SelectTrigger className="h-7 w-[120px]">
                          <Badge variant="outline" className={statusColor[l.status ?? "new"]}>{l.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>{LEAD_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{l.score}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {l.status !== "won" && (
                          <Button size="icon" variant="ghost" title="Convert to Contact" onClick={() => setConvertId(l.id)}>
                            <ArrowRightCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(l.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{isLoading ? "Loading..." : "No leads found"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Convert Dialog */}
        <Dialog open={!!convertId} onOpenChange={() => setConvertId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Convert Lead to Contact</DialogTitle></DialogHeader>
            {convertLead && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This will create a new contact from <strong>{convertLead.name}</strong> and mark this lead as won.
                </p>
                <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                  <p><strong>Name:</strong> {convertLead.name}</p>
                  <p><strong>Email:</strong> {convertLead.email || "—"}</p>
                  <p><strong>Phone:</strong> {convertLead.phone || "—"}</p>
                </div>
                <Button onClick={() => convertMutation.mutate(convertLead)} className="w-full">
                  <ArrowRightCircle className="w-4 h-4 mr-2" />Convert to Contact
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
