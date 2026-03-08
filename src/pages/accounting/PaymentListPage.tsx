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
import { Plus, CreditCard, Loader2, Search, Pencil, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const PAYMENT_METHODS = ["cash", "bank_transfer", "credit_card", "check", "online", "other"];
const TYPES = ["received", "sent", "refund"];
const STATUSES = ["completed", "pending", "failed", "refunded"];
const emptyForm = { amount: "", payment_date: format(new Date(), "yyyy-MM-dd"), payment_method: "bank_transfer", type: "received", status: "completed", account_id: "", customer_id: "", invoice_id: "", notes: "", transaction_reference: "" };

export default function PaymentListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["ac_payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_payments").select("*, ac_customers(name), ac_invoices(invoice_number), ac_accounts(name, code)").order("payment_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: accounts } = useQuery({ queryKey: ["ac_accounts_list"], queryFn: async () => { const { data } = await supabase.from("ac_accounts").select("id, name, code").eq("is_active", true); return data ?? []; }, enabled: !!user });
  const { data: customers } = useQuery({ queryKey: ["ac_customers_list"], queryFn: async () => { const { data } = await supabase.from("ac_customers").select("id, name"); return data ?? []; }, enabled: !!user });
  const { data: invoices } = useQuery({ queryKey: ["ac_invoices_list"], queryFn: async () => { const { data } = await supabase.from("ac_invoices").select("id, invoice_number").in("status", ["sent", "overdue", "partial"]); return data ?? []; }, enabled: !!user });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = {
        amount: parseFloat(form.amount) || 0, payment_date: form.payment_date,
        payment_method: form.payment_method, type: form.type, status: form.status,
        account_id: form.account_id, customer_id: form.customer_id || null,
        invoice_id: form.invoice_id || null, notes: form.notes || null,
        transaction_reference: form.transaction_reference || null, user_id: user!.id,
      };
      if (editId) {
        const { error } = await supabase.from("ac_payments").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_payments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_payments"] }); toast({ title: editId ? "Payment updated" : "Payment recorded" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_payments").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_payments"] }); toast({ title: "Payment deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ amount: String(r.amount), payment_date: r.payment_date, payment_method: r.payment_method, type: r.type || "received", status: r.status || "completed", account_id: r.account_id || "", customer_id: r.customer_id || "", invoice_id: r.invoice_id || "", notes: r.notes || "", transaction_reference: r.transaction_reference || "" });
    setOpen(true);
  };

  const filtered = (payments ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.ac_customers?.name || "").toLowerCase().includes(q) || (r.transaction_reference || "").toLowerCase().includes(q);
    const matchType = filterType === "all" || r.type === filterType;
    return matchSearch && matchType;
  });

  const totalReceived = filtered.filter(p => p.type === "received" && p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
  const totalSent = filtered.filter(p => p.type === "sent" && p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6 text-primary" /> Payments</h1>
            <p className="text-muted-foreground">Track all payment transactions.</p>
          </div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Record Payment</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Payment" : "Record Payment"}</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><Label>Date *</Label><Input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
                <div><Label>Account *</Label>
                  <Select value={form.account_id} onValueChange={v => setForm({ ...form, account_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>{(accounts ?? []).map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Payment Method</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label>Customer</Label>
                  <Select value={form.customer_id} onValueChange={v => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent><SelectItem value="">None</SelectItem>{(customers ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Invoice</Label>
                  <Select value={form.invoice_id} onValueChange={v => setForm({ ...form, invoice_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                    <SelectContent><SelectItem value="">None</SelectItem>{(invoices ?? []).map(i => <SelectItem key={i.id} value={i.id}>{i.invoice_number}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Reference</Label><Input value={form.transaction_reference} onChange={e => setForm({ ...form, transaction_reference: e.target.value })} /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.amount || !form.payment_date || !form.account_id} className="w-full">{editId ? "Update" : "Record"} Payment</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Received</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${totalReceived.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">${totalSent.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{filtered.filter(p => p.status === "pending").length}</div></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select>
        </div>

        <Card>
          <CardContent className="pt-4">
            {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Invoice</TableHead><TableHead>Method</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{format(new Date(r.payment_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{r.ac_customers?.name || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.ac_invoices?.invoice_number || "—"}</TableCell>
                      <TableCell className="capitalize">{r.payment_method}</TableCell>
                      <TableCell><Badge variant={r.type === "received" ? "secondary" : "outline"} className="capitalize">{r.type}</Badge></TableCell>
                      <TableCell className="text-right font-medium">${Number(r.amount).toFixed(2)}</TableCell>
                      <TableCell><Badge variant={r.status === "completed" ? "secondary" : r.status === "failed" ? "destructive" : "outline"} className="capitalize gap-1">{r.status === "completed" && <CheckCircle className="w-3 h-3" />}{r.status === "failed" && <AlertCircle className="w-3 h-3" />}{r.status}</Badge></TableCell>
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
              <div className="py-12 text-center"><CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium mb-1">No Payment Records</h3></div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
