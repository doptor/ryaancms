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
import { Plus, Users, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

const EMP_TYPES = ["full_time", "part_time", "contract", "intern"];
const STATUSES = ["active", "on_leave", "terminated", "resigned"];
const emptyForm = { employee_id: "", name: "", email: "", phone: "", address: "", date_of_birth: "", gender: "male", department_id: "", designation: "", hire_date: format(new Date(), "yyyy-MM-dd"), employment_type: "full_time", basic_salary: "", bank_name: "", bank_account: "", emergency_contact_name: "", emergency_contact_phone: "", notes: "" };

export default function HREmployeesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: employees, isLoading } = useQuery({
    queryKey: ["hr_employees"], queryFn: async () => { const { data, error } = await supabase.from("hr_employees").select("*, hr_departments(name)").order("name"); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: departments } = useQuery({
    queryKey: ["hr_departments_list"], queryFn: async () => { const { data } = await supabase.from("hr_departments").select("id, name"); return data ?? []; }, enabled: !!user,
  });

  const nextEmpId = () => {
    const nums = (employees ?? []).map(e => parseInt(e.employee_id?.replace(/\D/g, "") || "0")).filter(n => !isNaN(n));
    return `EMP-${String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(4, "0")}`;
  };

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form, basic_salary: parseFloat(form.basic_salary) || 0, department_id: form.department_id || null, user_id: user!.id };
      delete payload.date_of_birth; if (form.date_of_birth) payload.date_of_birth = form.date_of_birth;
      if (editId) { const { error } = await supabase.from("hr_employees").update(payload).eq("id", editId); if (error) throw error; }
      else { payload.status = "active"; const { error } = await supabase.from("hr_employees").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_employees"] }); toast({ title: editId ? "Employee updated" : "Employee added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_employees").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_employees"] }); toast({ title: "Employee removed" }); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "terminated" || status === "resigned") updates.termination_date = format(new Date(), "yyyy-MM-dd");
      const { error } = await supabase.from("hr_employees").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_employees"] }); toast({ title: "Status updated" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ employee_id: r.employee_id, name: r.name, email: r.email || "", phone: r.phone || "", address: r.address || "", date_of_birth: r.date_of_birth || "", gender: r.gender || "male", department_id: r.department_id || "", designation: r.designation || "", hire_date: r.hire_date, employment_type: r.employment_type || "full_time", basic_salary: String(r.basic_salary ?? 0), bank_name: r.bank_name || "", bank_account: r.bank_account || "", emergency_contact_name: r.emergency_contact_name || "", emergency_contact_phone: r.emergency_contact_phone || "", notes: r.notes || "" });
    setOpen(true);
  };

  const filtered = (employees ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.employee_id.toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q);
    const matchDept = filterDept === "all" || r.department_id === filterDept;
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const statusColor: Record<string, string> = { active: "text-green-700 bg-green-100", on_leave: "text-yellow-700 bg-yellow-100", terminated: "text-red-700 bg-red-100", resigned: "text-gray-700 bg-gray-100" };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Employees</h1>
            <p className="text-muted-foreground">Manage employee directory</p>
          </div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else { setForm({ ...emptyForm, employee_id: nextEmpId() }); setOpen(true); } }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Employee</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editId ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Employee ID *</Label><Input value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} /></div>
                  <div><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
                  <div><Label>Gender</Label><Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Department</Label><Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="">None</SelectItem>{(departments ?? []).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g., Software Engineer" /></div>
                  <div><Label>Hire Date *</Label><Input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Type</Label><Select value={form.employment_type} onValueChange={v => setForm({ ...form, employment_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EMP_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Basic Salary</Label><Input type="number" value={form.basic_salary} onChange={e => setForm({ ...form, basic_salary: e.target.value })} /></div>
                  <div><Label>Bank Name</Label><Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Bank Account</Label><Input value={form.bank_account} onChange={e => setForm({ ...form, bank_account: e.target.value })} /></div>
                  <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Emergency Contact</Label><Input value={form.emergency_contact_name} onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })} /></div>
                  <div><Label>Emergency Phone</Label><Input value={form.emergency_contact_phone} onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                <Button onClick={() => upsert.mutate()} disabled={!form.employee_id || !form.name || !form.hire_date} className="w-full">{editId ? "Update" : "Add"} Employee</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterDept} onValueChange={setFilterDept}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Depts</SelectItem>{(departments ?? []).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
        </div>

        <Card>
          <CardContent className="pt-4">
            {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Designation</TableHead><TableHead>Type</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.employee_id}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{(r as any).hr_departments?.name || "—"}</TableCell>
                      <TableCell>{r.designation || "—"}</TableCell>
                      <TableCell className="capitalize">{(r.employment_type || "").replace(/_/g, " ")}</TableCell>
                      <TableCell>${Number(r.basic_salary ?? 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Select value={r.status || "active"} onValueChange={v => updateStatus.mutate({ id: r.id, status: v })}>
                          <SelectTrigger className="h-7 w-28"><Badge className={`text-[10px] ${statusColor[r.status || "active"]}`}>{(r.status || "active").replace(/_/g, " ")}</Badge></SelectTrigger>
                          <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
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
            ) : <div className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium mb-1">No Employees</h3></div>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
