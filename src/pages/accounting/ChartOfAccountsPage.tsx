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
import { Plus, BookOpen, Search, Pencil, Trash2, Loader2 } from "lucide-react";

const ACCOUNT_TYPES = ["asset", "liability", "equity", "revenue", "expense"];
const CATEGORIES = ["current", "fixed", "long_term", "operating", "non_operating", "other"];
const emptyForm = { code: "", name: "", type: "asset", category: "current", description: "", opening_balance: "0" };

export default function ChartOfAccountsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["ac_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_accounts").select("*").order("code");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code, name: form.name, type: form.type, category: form.category,
        description: form.description || null,
        opening_balance: parseFloat(form.opening_balance) || 0,
        current_balance: parseFloat(form.opening_balance) || 0,
        user_id: user!.id,
      };
      if (editId) {
        const { error } = await supabase.from("ac_accounts").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_accounts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_accounts"] }); toast({ title: editId ? "Account updated" : "Account created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_accounts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_accounts"] }); toast({ title: "Account deleted" }); },
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      const defaults = [
        { code: "1000", name: "Cash", type: "asset", category: "current" },
        { code: "1100", name: "Bank Account", type: "asset", category: "current" },
        { code: "1200", name: "Accounts Receivable", type: "asset", category: "current" },
        { code: "1500", name: "Equipment", type: "asset", category: "fixed" },
        { code: "2000", name: "Accounts Payable", type: "liability", category: "current" },
        { code: "2100", name: "Credit Card", type: "liability", category: "current" },
        { code: "3000", name: "Owner's Equity", type: "equity", category: "other" },
        { code: "3100", name: "Retained Earnings", type: "equity", category: "other" },
        { code: "4000", name: "Sales Revenue", type: "revenue", category: "operating" },
        { code: "4100", name: "Service Revenue", type: "revenue", category: "operating" },
        { code: "5000", name: "Cost of Goods Sold", type: "expense", category: "operating" },
        { code: "5100", name: "Salaries", type: "expense", category: "operating" },
        { code: "5200", name: "Rent", type: "expense", category: "operating" },
        { code: "5300", name: "Utilities", type: "expense", category: "operating" },
        { code: "5400", name: "Office Supplies", type: "expense", category: "operating" },
      ];
      const { error } = await supabase.from("ac_accounts").insert(defaults.map(d => ({ ...d, user_id: user!.id, opening_balance: 0, current_balance: 0 })));
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ac_accounts"] }); toast({ title: "Default accounts created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ code: r.code, name: r.name, type: r.type || "asset", category: r.category || "current", description: r.description || "", opening_balance: String(r.opening_balance ?? 0) });
    setOpen(true);
  };

  const filtered = (accounts ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
    const matchType = filterType === "all" || r.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" /> Chart of Accounts</h1>
            <p className="text-muted-foreground">Manage your financial account structure.</p>
          </div>
          <div className="flex gap-2">
            {(accounts ?? []).length === 0 && <Button variant="outline" onClick={() => seedDefaults.mutate()}>Create Defaults</Button>}
            <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Account</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editId ? "Edit Account" : "Add Account"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Code *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. 1000" /></div>
                    <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Type</Label>
                      <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Category</Label>
                      <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Opening Balance</Label><Input type="number" step="0.01" value={form.opening_balance} onChange={e => setForm({ ...form, opening_balance: e.target.value })} /></div>
                  <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                  <Button onClick={() => upsert.mutate()} disabled={!form.code || !form.name} className="w-full">{editId ? "Update" : "Create"} Account</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search by code or name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select>
        </div>

        <Card>
          <CardContent className="pt-4">
            {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead className="w-[100px]">Code</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.code}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{r.type}</Badge></TableCell>
                      <TableCell className="capitalize">{r.category?.replace(/_/g, " ") || "—"}</TableCell>
                      <TableCell className="text-right font-medium">${Number(r.current_balance ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                          {!r.is_system && <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this account?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No Accounts Found</h3>
                <p className="text-muted-foreground mb-4">Create default accounts or add your own.</p>
                <Button variant="outline" onClick={() => seedDefaults.mutate()}>Create Default Accounts</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
