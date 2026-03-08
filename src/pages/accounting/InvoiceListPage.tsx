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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, FileText, Loader2, Search, Pencil, Trash2, Send, Download, Eye } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["draft", "sent", "paid", "overdue", "partial", "cancelled"];
const emptyForm = { invoice_number: "", customer_id: "", issue_date: format(new Date(), "yyyy-MM-dd"), due_date: "", notes: "", terms: "", items: [{ description: "", quantity: "1", unit_price: "" }] };

type InvoiceItem = { description: string; quantity: string; unit_price: string };

export default function InvoiceListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["ac_invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_invoices").select("*, ac_customers(name, email)").order("issue_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: customers } = useQuery({ queryKey: ["ac_customers_list"], queryFn: async () => { const { data } = await supabase.from("ac_customers").select("id, name"); return data ?? []; }, enabled: !!user });

  const nextInvoiceNumber = () => {
    const existing = (invoices ?? []).map(i => i.invoice_number).filter(n => /^INV-\d+$/.test(n)).map(n => parseInt(n.replace("INV-", "")));
    const max = existing.length > 0 ? Math.max(...existing) : 0;
    return `INV-${String(max + 1).padStart(4, "0")}`;
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: "", quantity: "1", unit_price: "" }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: keyof InvoiceItem, val: string) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const subtotal = form.items.reduce((s, item) => s + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0);

  const createInvoice = useMutation({
    mutationFn: async () => {
      const invNum = form.invoice_number || nextInvoiceNumber();
      const { data: inv, error } = await supabase.from("ac_invoices").insert({
        invoice_number: invNum, customer_id: form.customer_id || null,
        issue_date: form.issue_date, due_date: form.due_date || form.issue_date,
        subtotal, tax_amount: 0, total_amount: subtotal, amount_due: subtotal, amount_paid: 0,
        notes: form.notes || null, terms: form.terms || null, user_id: user!.id, status: "draft",
      }).select("id").single();
      if (error) throw error;

      const validItems = form.items.filter(item => item.description && item.unit_price);
      if (validItems.length > 0) {
        const { error: itemErr } = await supabase.from("ac_invoice_items").insert(
          validItems.map((item, idx) => ({
            invoice_id: inv.id, description: item.description,
            quantity: parseFloat(item.quantity) || 1, unit_price: parseFloat(item.unit_price) || 0,
            total: (parseFloat(item.quantity) || 1) * (parseFloat(item.unit_price) || 0), sort_order: idx,
          }))
        );
        if (itemErr) throw itemErr;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_invoices"] }); toast({ title: "Invoice created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "sent") updates.sent_at = new Date().toISOString();
      if (status === "paid") { updates.paid_at = new Date().toISOString(); updates.amount_due = 0; }
      const { error } = await supabase.from("ac_invoices").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_invoices"] }); toast({ title: "Invoice status updated" }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("ac_invoice_items").delete().eq("invoice_id", id);
      const { error } = await supabase.from("ac_invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_invoices"] }); toast({ title: "Invoice deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm({ ...emptyForm, invoice_number: "", items: [{ description: "", quantity: "1", unit_price: "" }] }); };

  const getStatusColor = (s: string) => {
    switch (s) { case "paid": return "secondary"; case "sent": return "default"; case "draft": return "outline"; case "overdue": return "destructive"; default: return "outline"; }
  };

  const filtered = (invoices ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.invoice_number.toLowerCase().includes(q) || (r.ac_customers?.name || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalInvoiced = filtered.reduce((s, r) => s + Number(r.total_amount ?? 0), 0);
  const totalPaid = filtered.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const totalOutstanding = filtered.reduce((s, r) => s + Number(r.amount_due ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-primary" /> Invoices</h1>
            <p className="text-muted-foreground">Create and manage customer invoices.</p>
          </div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else { setForm({ ...emptyForm, invoice_number: nextInvoiceNumber(), items: [{ description: "", quantity: "1", unit_price: "" }] }); setOpen(true); } }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Create Invoice</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Invoice # *</Label><Input value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></div>
                  <div><Label>Issue Date *</Label><Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} /></div>
                  <div><Label>Due Date *</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
                </div>
                <div><Label>Customer</Label>
                  <Select value={form.customer_id} onValueChange={v => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent><SelectItem value="">None</SelectItem>{(customers ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2"><Label className="text-sm font-semibold">Line Items</Label><Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add Item</Button></div>
                  <div className="space-y-2">
                    {form.items.map((item, i) => (
                      <div key={i} className="grid grid-cols-[1fr_80px_100px_40px] gap-2 items-end">
                        <div><Label className="text-xs">Description</Label><Input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Item description" /></div>
                        <div><Label className="text-xs">Qty</Label><Input type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} /></div>
                        <div><Label className="text-xs">Price</Label><Input type="number" step="0.01" value={item.unit_price} onChange={e => updateItem(i, "unit_price", e.target.value)} /></div>
                        <Button size="sm" variant="ghost" onClick={() => removeItem(i)} disabled={form.items.length <= 1}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="text-right mt-2 font-semibold">Subtotal: ${subtotal.toFixed(2)}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                  <div><Label>Terms</Label><Textarea value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} rows={2} /></div>
                </div>
                <Button onClick={() => createInvoice.mutate()} disabled={!form.invoice_number || !form.issue_date || form.items.every(i => !i.description)} className="w-full">Create Invoice (${subtotal.toFixed(2)})</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">${totalInvoiced.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">${totalOutstanding.toFixed(2)}</div></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
        </div>

        <Card>
          <CardContent className="pt-4">
            {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Issue Date</TableHead><TableHead>Due Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Paid</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.invoice_number}</TableCell>
                      <TableCell>{r.ac_customers?.name || "—"}</TableCell>
                      <TableCell>{format(new Date(r.issue_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{format(new Date(r.due_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="text-right font-medium">${Number(r.total_amount ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${Number(r.amount_paid ?? 0).toFixed(2)}</TableCell>
                      <TableCell><Badge variant={getStatusColor(r.status ?? "draft")} className="capitalize">{r.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {r.status === "draft" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "sent" })}><Send className="w-3.5 h-3.5" /></Button>}
                          {(r.status === "sent" || r.status === "overdue") && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "paid" })}>Mark Paid</Button>}
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this invoice?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium mb-1">No Invoices Yet</h3><p className="text-muted-foreground mb-4">Create your first invoice to get started.</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
