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
import { Plus, DollarSign, Search, Pencil, Trash2, Loader2, CheckCircle, Send } from "lucide-react";
import { format } from "date-fns";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const emptyForm = { employee_id: "", pay_period: `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`, pay_date: format(new Date(), "yyyy-MM-dd"), basic_salary: "", allowances: "0", overtime: "0", deductions: "0", tax: "0", notes: "" };

export default function HRPayrollPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: payrolls, isLoading } = useQuery({
    queryKey: ["hr_payroll"], queryFn: async () => { const { data, error } = await supabase.from("hr_payroll").select("*, hr_employees(name, employee_id, basic_salary)").order("pay_date", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: employees } = useQuery({ queryKey: ["hr_emp_payroll"], queryFn: async () => { const { data } = await supabase.from("hr_employees").select("id, name, employee_id, basic_salary").eq("status", "active"); return data ?? []; }, enabled: !!user });

  const netSalary = (parseFloat(form.basic_salary) || 0) + (parseFloat(form.allowances) || 0) + (parseFloat(form.overtime) || 0) - (parseFloat(form.deductions) || 0) - (parseFloat(form.tax) || 0);

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { employee_id: form.employee_id, pay_period: form.pay_period, pay_date: form.pay_date, basic_salary: parseFloat(form.basic_salary) || 0, allowances: parseFloat(form.allowances) || 0, overtime: parseFloat(form.overtime) || 0, deductions: parseFloat(form.deductions) || 0, tax: parseFloat(form.tax) || 0, net_salary: netSalary, notes: form.notes || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("hr_payroll").update(payload).eq("id", editId); if (error) throw error; }
      else { payload.status = "draft"; const { error } = await supabase.from("hr_payroll").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_payroll"] }); toast({ title: editId ? "Payslip updated" : "Payslip created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const processPayroll = useMutation({
    mutationFn: async (id: string) => {
      const payslip = (payrolls ?? []).find(p => p.id === id);
      if (!payslip) throw new Error("Not found");
      // Mark as processed
      const { error: upErr } = await supabase.from("hr_payroll").update({ status: "processed" }).eq("id", id);
      if (upErr) throw upErr;
      // Sync to accounting - create expense
      const { error: expErr } = await supabase.from("ac_expenses").insert({
        amount: Number(payslip.net_salary), expense_date: payslip.pay_date,
        description: `Salary: ${payslip.hr_employees?.name} - ${payslip.pay_period}`,
        payment_method: "bank_transfer", approval_status: "approved",
        user_id: user!.id, submitted_by: user!.id,
      });
      if (expErr) throw expErr;
      // Mark synced
      await supabase.from("hr_payroll").update({ synced_to_accounting: true }).eq("id", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_payroll"] }); toast({ title: "Payroll processed & synced to Accounting" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_payroll").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_payroll"] }); toast({ title: "Payslip deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ employee_id: r.employee_id, pay_period: r.pay_period, pay_date: r.pay_date, basic_salary: String(r.basic_salary), allowances: String(r.allowances ?? 0), overtime: String(r.overtime ?? 0), deductions: String(r.deductions ?? 0), tax: String(r.tax ?? 0), notes: r.notes || "" });
    setOpen(true);
  };

  const onEmployeeSelect = (empId: string) => {
    const emp = (employees ?? []).find(e => e.id === empId);
    setForm({ ...form, employee_id: empId, basic_salary: String(emp?.basic_salary ?? 0) });
  };

  const runBulkPayroll = useMutation({
    mutationFn: async () => {
      const period = `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;
      const activeEmps = employees ?? [];
      const existing = (payrolls ?? []).filter(p => p.pay_period === period).map(p => p.employee_id);
      const newEmps = activeEmps.filter(e => !existing.includes(e.id));
      if (newEmps.length === 0) throw new Error("All employees already have payslips for this period");
      const { error } = await supabase.from("hr_payroll").insert(newEmps.map(e => ({
        employee_id: e.id, pay_period: period, pay_date: format(new Date(), "yyyy-MM-dd"),
        basic_salary: Number(e.basic_salary ?? 0), net_salary: Number(e.basic_salary ?? 0),
        status: "draft", user_id: user!.id,
      })));
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_payroll"] }); toast({ title: "Bulk payroll generated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = (payrolls ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.hr_employees?.name || "").toLowerCase().includes(q) || r.pay_period.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalNet = filtered.reduce((s, r) => s + Number(r.net_salary ?? 0), 0);
  const processedCount = filtered.filter(p => p.status === "processed").length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary" /> Payroll</h1><p className="text-muted-foreground">Salary processing with accounting integration</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => runBulkPayroll.mutate()}>Generate Bulk Payroll</Button>
            <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Payslip</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editId ? "Edit Payslip" : "Create Payslip"}</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  <div><Label>Employee *</Label><Select value={form.employee_id} onValueChange={onEmployeeSelect}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(employees ?? []).map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.employee_id})</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Pay Period</Label><Input value={form.pay_period} onChange={e => setForm({ ...form, pay_period: e.target.value })} /></div>
                    <div><Label>Pay Date</Label><Input type="date" value={form.pay_date} onChange={e => setForm({ ...form, pay_date: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Basic Salary</Label><Input type="number" value={form.basic_salary} onChange={e => setForm({ ...form, basic_salary: e.target.value })} /></div>
                    <div><Label>Allowances</Label><Input type="number" value={form.allowances} onChange={e => setForm({ ...form, allowances: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Overtime</Label><Input type="number" value={form.overtime} onChange={e => setForm({ ...form, overtime: e.target.value })} /></div>
                    <div><Label>Deductions</Label><Input type="number" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} /></div>
                    <div><Label>Tax</Label><Input type="number" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} /></div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center"><span className="text-sm text-muted-foreground">Net Salary:</span><div className="text-xl font-bold text-foreground">${netSalary.toFixed(2)}</div></div>
                  <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                  <Button onClick={() => upsert.mutate()} disabled={!form.employee_id} className="w-full">{editId ? "Update" : "Create"} Payslip</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Net Salary</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">${totalNet.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Processed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{processedCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{filtered.filter(p => p.status === "draft").length}</div></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="processed">Processed</SelectItem></SelectContent></Select>
        </div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Period</TableHead><TableHead className="text-right">Basic</TableHead><TableHead className="text-right">Deductions</TableHead><TableHead className="text-right">Net</TableHead><TableHead>Status</TableHead><TableHead>Synced</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.hr_employees?.name}</TableCell><TableCell>{r.pay_period}</TableCell>
                  <TableCell className="text-right">${Number(r.basic_salary ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">${(Number(r.deductions ?? 0) + Number(r.tax ?? 0)).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">${Number(r.net_salary ?? 0).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={r.status === "processed" ? "secondary" : "outline"} className="capitalize">{r.status}</Badge></TableCell>
                  <TableCell>{r.synced_to_accounting ? <CheckCircle className="w-4 h-4 text-green-600" /> : "—"}</TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end">
                    {r.status === "draft" && <Button size="sm" variant="outline" onClick={() => processPayroll.mutate(r.id)} title="Process & sync to accounting"><Send className="w-3.5 h-3.5" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div></TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Payroll Records</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
