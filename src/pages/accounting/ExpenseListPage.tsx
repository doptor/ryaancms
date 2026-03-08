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
import { Plus, Receipt, Loader2, Search, Pencil, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const PAYMENT_METHODS = ["cash", "bank_transfer", "credit_card", "check", "online", "other"];
const emptyForm = { amount: "", expense_date: format(new Date(), "yyyy-MM-dd"), description: "", payment_method: "bank_transfer", reference: "", vendor_id: "", account_id: "", category_id: "", is_billable: false };

export default function ExpenseListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["ac_expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_expenses").select("*, ac_vendors(name), ac_accounts(name, code), ac_expense_categories(name)").order("expense_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: vendors } = useQuery({ queryKey: ["ac_vendors_list"], queryFn: async () => { const { data } = await supabase.from("ac_vendors").select("id, name"); return data ?? []; }, enabled: !!user });
  const { data: accounts } = useQuery({ queryKey: ["ac_accounts_list"], queryFn: async () => { const { data } = await supabase.from("ac_accounts").select("id, name, code").eq("is_active", true); return data ?? []; }, enabled: !!user });
  const { data: categories } = useQuery({ queryKey: ["ac_expense_cats"], queryFn: async () => { const { data } = await supabase.from("ac_expense_categories").select("id, name"); return data ?? []; }, enabled: !!user });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = {
        amount: parseFloat(form.amount) || 0, expense_date: form.expense_date, description: form.description,
        payment_method: form.payment_method, reference: form.reference || null,
        vendor_id: form.vendor_id || null, account_id: form.account_id || null,
        category_id: form.category_id || null, is_billable: form.is_billable,
        user_id: user!.id, submitted_by: user!.id,
      };
      if (editId) {
        const { error } = await supabase.from("ac_expenses").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        payload.approval_status = "approved";
        const { error } = await supabase.from("ac_expenses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_expenses"] }); toast({ title: editId ? "Expense updated" : "Expense recorded" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_expenses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_expenses"] }); toast({ title: "Expense deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("ac_expenses").update({ approval_status: status, approved_by: user!.id, approved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_expenses"] }); toast({ title: "Status updated" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ amount: String(r.amount), expense_date: r.expense_date, description: r.description || "", payment_method: r.payment_method || "bank_transfer", reference: r.reference || "", vendor_id: r.vendor_id || "", account_id: r.account_id || "", category_id: r.category_id || "", is_billable: r.is_billable || false });
    setOpen(true);
  };

  const filtered = (expenses ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.description || "").toLowerCase().includes(q) || (r.ac_vendors?.name || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.approval_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalExpenses = filtered.reduce((s, r) => s + Number(r.amount), 0);
  const pendingCount = filtered.filter(e => e.approval_status === "pending").length;
  const approvedCount = filtered.filter(e => e.approval_status === "approved").length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="w-6 h-6 text-primary" /> Expense Management</h1>
            <p className="text-muted-foreground">Track and approve business expenses.</p>
          </div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Record Expense</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Expense" : "Record Expense"}</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><Label>Date *</Label><Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Vendor</Label>
                    <Select value={form.vendor_id} onValueChange={v => setForm({ ...form, vendor_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent><SelectItem value="">None</SelectItem>{(vendors ?? []).map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Category</Label>
                    <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent><SelectItem value="">None</SelectItem>{(categories ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Account</Label>
                  <Select value={form.account_id} onValueChange={v => setForm({ ...form, account_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent><SelectItem value="">None</SelectItem>{(accounts ?? []).map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Payment Method</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                <div><Label>Reference</Label><Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.amount || !form.expense_date} className="w-full">{editId ? "Update" : "Record"} Expense</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{approvedCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{pendingCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{filtered.length}</div></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
        </div>

        <Card>
          <CardContent className="pt-4">
            {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Vendor</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{format(new Date(r.expense_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{r.ac_vendors?.name || "—"}</TableCell>
                      <TableCell>{r.ac_expense_categories?.name || "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{r.description || "—"}</TableCell>
                      <TableCell className="text-right font-medium">${Number(r.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {r.approval_status === "approved" && <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" />Approved</Badge>}
                        {r.approval_status === "pending" && <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Pending</Badge>}
                        {r.approval_status === "rejected" && <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {r.approval_status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "approved" })}><CheckCircle className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: r.id, status: "rejected" })}><XCircle className="w-3 h-3" /></Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center"><Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium mb-1">No Expense Records</h3></div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
