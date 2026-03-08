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
import { Plus, TrendingUp, Loader2, Search, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = ["Sales", "Service", "Interest", "Dividend", "Rental", "Commission", "Other"];
const PAYMENT_METHODS = ["cash", "bank_transfer", "credit_card", "check", "online", "other"];

const emptyForm = { amount: "", income_date: format(new Date(), "yyyy-MM-dd"), category: "Sales", description: "", payment_method: "bank_transfer", reference: "", customer_id: "", account_id: "", is_recurring: false, recurring_frequency: "" };

export default function IncomeListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: incomes, isLoading } = useQuery({
    queryKey: ["ac_income"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_income").select("*, ac_customers(name), ac_accounts(name, code)").order("income_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: customers } = useQuery({
    queryKey: ["ac_customers_list"],
    queryFn: async () => { const { data } = await supabase.from("ac_customers").select("id, name"); return data ?? []; },
    enabled: !!user,
  });

  const { data: accounts } = useQuery({
    queryKey: ["ac_accounts_list"],
    queryFn: async () => { const { data } = await supabase.from("ac_accounts").select("id, name, code").eq("is_active", true); return data ?? []; },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        amount: parseFloat(form.amount) || 0,
        income_date: form.income_date,
        category: form.category,
        description: form.description,
        payment_method: form.payment_method,
        reference: form.reference || null,
        customer_id: form.customer_id || null,
        account_id: form.account_id || null,
        is_recurring: form.is_recurring,
        recurring_frequency: form.is_recurring ? form.recurring_frequency : null,
        user_id: user!.id,
      };
      if (editId) {
        const { error } = await supabase.from("ac_income").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_income").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ac_income"] });
      toast({ title: editId ? "Income updated" : "Income recorded" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ac_income").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_income"] }); toast({ title: "Income deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };

  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ amount: String(r.amount), income_date: r.income_date, category: r.category || "Sales", description: r.description || "", payment_method: r.payment_method || "bank_transfer", reference: r.reference || "", customer_id: r.customer_id || "", account_id: r.account_id || "", is_recurring: r.is_recurring || false, recurring_frequency: r.recurring_frequency || "" });
    setOpen(true);
  };

  const filtered = (incomes ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.description || "").toLowerCase().includes(q) || (r.reference || "").toLowerCase().includes(q) || (r.ac_customers?.name || "").toLowerCase().includes(q);
    const matchCat = filterCat === "all" || r.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalIncome = filtered.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6 text-primary" /> Income Management</h1>
            <p className="text-muted-foreground">Track and manage all income sources.</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Record Income</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Income" : "Record Income"}</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><Label>Date *</Label><Input type="date" value={form.income_date} onChange={e => setForm({ ...form, income_date: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Payment Method</Label>
                    <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Customer</Label>
                  <Select value={form.customer_id} onValueChange={v => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(customers ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Account</Label>
                  <Select value={form.account_id} onValueChange={v => setForm({ ...form, account_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(accounts ?? []).map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                <div><Label>Reference</Label><Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.amount || !form.income_date} className="w-full">{editId ? "Update" : "Record"} Income</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{filtered.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Recurring</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{filtered.filter(i => i.is_recurring).length}</div></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterCat} onValueChange={setFilterCat}><SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        </div>

        <Card>
          <CardContent className="pt-4">
            {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{format(new Date(r.income_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{r.ac_customers?.name || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{r.category || "General"}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.description || "—"}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">${Number(r.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this income record?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No Income Records</h3>
                <p className="text-muted-foreground mb-4">Start tracking income by adding your first record.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
