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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, CalendarDays, Search, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const emptyForm = { employee_id: "", leave_type_id: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: format(new Date(), "yyyy-MM-dd"), reason: "" };
const emptyTypeForm = { name: "", days_allowed: "15", is_paid: true };

export default function HRLeavePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [typeForm, setTypeForm] = useState(emptyTypeForm);

  const { data: leaveReqs, isLoading } = useQuery({
    queryKey: ["hr_leave_requests"], queryFn: async () => { const { data, error } = await supabase.from("hr_leave_requests").select("*, hr_employees(name, employee_id), hr_leave_types(name)").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: employees } = useQuery({ queryKey: ["hr_emp_leave"], queryFn: async () => { const { data } = await supabase.from("hr_employees").select("id, name, employee_id").eq("status", "active"); return data ?? []; }, enabled: !!user });
  const { data: leaveTypes } = useQuery({ queryKey: ["hr_leave_types"], queryFn: async () => { const { data } = await supabase.from("hr_leave_types").select("*").eq("is_active", true); return data ?? []; }, enabled: !!user });

  const createReq = useMutation({
    mutationFn: async () => {
      const days = differenceInDays(new Date(form.end_date), new Date(form.start_date)) + 1;
      const { error } = await supabase.from("hr_leave_requests").insert({ employee_id: form.employee_id, leave_type_id: form.leave_type_id || null, start_date: form.start_date, end_date: form.end_date, days_count: days, reason: form.reason || null, status: "pending", user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_leave_requests"] }); toast({ title: "Leave request submitted" }); setOpen(false); setForm(emptyForm); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createType = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("hr_leave_types").insert({ name: typeForm.name, days_allowed: parseInt(typeForm.days_allowed) || 0, is_paid: typeForm.is_paid, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_leave_types"] }); toast({ title: "Leave type created" }); setTypeOpen(false); setTypeForm(emptyTypeForm); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("hr_leave_requests").update({ status, approved_by: user!.id, approved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_leave_requests"] }); toast({ title: "Leave request updated" }); },
  });

  const filtered = (leaveReqs ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.hr_employees?.name || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = (leaveReqs ?? []).filter(l => l.status === "pending").length;
  const approvedCount = (leaveReqs ?? []).filter(l => l.status === "approved").length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="w-6 h-6 text-primary" /> Leave Management</h1><p className="text-muted-foreground">Manage leave requests and types</p></div>
          <div className="flex gap-2">
            <Dialog open={typeOpen} onOpenChange={v => { setTypeOpen(v); if (!v) setTypeForm(emptyTypeForm); }}>
              <DialogTrigger asChild><Button variant="outline">Leave Types</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Manage Leave Types</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  {(leaveTypes ?? []).map(t => <div key={t.id} className="flex justify-between items-center p-2 border rounded"><span className="font-medium">{t.name}</span><Badge variant="secondary">{t.days_allowed} days</Badge></div>)}
                  <div className="border-t pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2"><Input placeholder="Type name" value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} /><Input type="number" placeholder="Days" value={typeForm.days_allowed} onChange={e => setTypeForm({ ...typeForm, days_allowed: e.target.value })} /></div>
                    <Button size="sm" onClick={() => createType.mutate()} disabled={!typeForm.name.trim()} className="w-full">Add Type</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setForm(emptyForm); } else setOpen(true); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Request</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Leave Request</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Employee *</Label><Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(employees ?? []).map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Leave Type</Label><Select value={form.leave_type_id} onValueChange={v => setForm({ ...form, leave_type_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(leaveTypes ?? []).map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.days_allowed}d)</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                    <div><Label>End Date *</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                  </div>
                  <div><Label>Reason</Label><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} /></div>
                  <Button onClick={() => createReq.mutate()} disabled={!form.employee_id || !form.start_date || !form.end_date} className="w-full">Submit Request</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{pendingCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{approvedCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(leaveReqs ?? []).length}</div></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
        </div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.hr_employees?.name}</TableCell><TableCell>{r.hr_leave_types?.name || "—"}</TableCell>
                  <TableCell>{format(new Date(r.start_date), "MMM dd")}</TableCell><TableCell>{format(new Date(r.end_date), "MMM dd")}</TableCell><TableCell>{r.days_count}</TableCell>
                  <TableCell>
                    {r.status === "pending" && <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Pending</Badge>}
                    {r.status === "approved" && <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" />Approved</Badge>}
                    {r.status === "rejected" && <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>}
                  </TableCell>
                  <TableCell className="text-right">{r.status === "pending" && <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "approved" })}><CheckCircle className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: r.id, status: "rejected" })}><XCircle className="w-3.5 h-3.5" /></Button>
                  </div>}</TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Leave Requests</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
