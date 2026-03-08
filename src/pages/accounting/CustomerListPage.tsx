import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Users, Search, Pencil, Trash2, Loader2 } from "lucide-react";

const emptyForm = { name: "", email: "", phone: "", address: "", tax_number: "" };

export default function CustomerListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["ac_customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_customers").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, email: form.email || null, phone: form.phone || null, address: form.address || null, tax_number: form.tax_number || null, user_id: user!.id };
      if (editId) {
        const { error } = await supabase.from("ac_customers").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_customers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_customers"] }); toast({ title: editId ? "Customer updated" : "Customer created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_customers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_customers"] }); toast({ title: "Customer deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => { setEditId(r.id); setForm({ name: r.name, email: r.email || "", phone: r.phone || "", address: r.address || "", tax_number: r.tax_number || "" }); setOpen(true); };

  const filtered = (customers ?? []).filter(r => { const q = search.toLowerCase(); return !q || r.name.toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q); });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Customers</h1>
            <p className="text-muted-foreground">Manage your customer directory.</p>
          </div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Customer</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>Tax Number</Label><Input value={form.tax_number} onChange={e => setForm({ ...form, tax_number: e.target.value })} /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.name.trim()} className="w-full">{editId ? "Update" : "Add"} Customer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-md" /></div>

        <Card>
          <CardContent className="pt-4">
            {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Tax #</TableHead><TableHead className="text-right">Outstanding</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.email || "—"}</TableCell>
                      <TableCell>{r.phone || "—"}</TableCell>
                      <TableCell>{r.tax_number || "—"}</TableCell>
                      <TableCell className="text-right">${Number(r.outstanding_balance ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium mb-1">No Customers</h3><p className="text-muted-foreground">Add your first customer to start invoicing.</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
