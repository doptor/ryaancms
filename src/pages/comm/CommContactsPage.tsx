import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Users, Search, Pencil, Trash2, Loader2, Phone, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const emptyForm = { name: "", phone: "", whatsapp_number: "", email: "", company: "", tags: "", notes: "", source: "manual" };

export default function CommContactsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["comm_contacts"], queryFn: async () => { const { data, error } = await supabase.from("comm_contacts").select("*").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, phone: form.phone || null, whatsapp_number: form.whatsapp_number || null, email: form.email || null, company: form.company || null, tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [], notes: form.notes || null, source: form.source, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("comm_contacts").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("comm_contacts").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_contacts"] }); toast({ title: editId ? "Contact updated" : "Contact added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("comm_contacts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_contacts"] }); toast({ title: "Contact deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (c: any) => { setEditId(c.id); setForm({ name: c.name, phone: c.phone || "", whatsapp_number: c.whatsapp_number || "", email: c.email || "", company: c.company || "", tags: (c.tags || []).join(", "), notes: c.notes || "", source: c.source || "manual" }); setOpen(true); };

  const filtered = (contacts ?? []).filter(c => { const q = search.toLowerCase(); return !q || c.name.toLowerCase().includes(q) || (c.phone || "").includes(q) || (c.email || "").toLowerCase().includes(q); });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Communication Contacts</h1><p className="text-muted-foreground">Manage contacts for calls & WhatsApp</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Contact</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit Contact" : "Add Contact"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+880..." /></div>
                  <div><Label>WhatsApp</Label><Input value={form.whatsapp_number} onChange={e => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+880..." /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Company</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                </div>
                <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="lead, vip, customer" /></div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.name.trim()} className="w-full">{editId ? "Update" : "Add"} Contact</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>WhatsApp</TableHead><TableHead>Email</TableHead><TableHead>Company</TableHead><TableHead>Tags</TableHead><TableHead>Stats</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell>{c.whatsapp_number || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.company || "—"}</TableCell>
                  <TableCell><div className="flex gap-1 flex-wrap">{(c.tags || []).map((t: string) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div></TableCell>
                  <TableCell><div className="flex gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.total_calls}</span><span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{c.total_messages}</span></div></TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end"><Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(c.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Contacts Yet</h3><p className="text-muted-foreground">Add contacts to start calling & messaging</p></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
