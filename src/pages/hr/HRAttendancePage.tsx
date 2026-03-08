import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Clock, Search, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

const ATT_STATUSES = ["present", "absent", "late", "half_day", "work_from_home"];
const emptyForm = { employee_id: "", attendance_date: format(new Date(), "yyyy-MM-dd"), check_in: "09:00", check_out: "17:00", status: "present", notes: "" };

export default function HRAttendancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [form, setForm] = useState(emptyForm);

  const { data: attendance, isLoading } = useQuery({
    queryKey: ["hr_attendance", filterDate], queryFn: async () => {
      const { data, error } = await supabase.from("hr_attendance").select("*, hr_employees(name, employee_id)").eq("attendance_date", filterDate).order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    }, enabled: !!user,
  });
  const { data: employees } = useQuery({
    queryKey: ["hr_emp_list_att"], queryFn: async () => { const { data } = await supabase.from("hr_employees").select("id, name, employee_id").eq("status", "active"); return data ?? []; }, enabled: !!user,
  });

  const createAtt = useMutation({
    mutationFn: async () => {
      const checkIn = form.check_in || null;
      const checkOut = form.check_out || null;
      let hoursWorked = 0;
      if (checkIn && checkOut) { const [h1, m1] = checkIn.split(":").map(Number); const [h2, m2] = checkOut.split(":").map(Number); hoursWorked = Math.max(0, (h2 + m2 / 60) - (h1 + m1 / 60)); }
      const { error } = await supabase.from("hr_attendance").insert({ employee_id: form.employee_id, attendance_date: form.attendance_date, check_in: checkIn, check_out: checkOut, status: form.status, notes: form.notes || null, hours_worked: Math.round(hoursWorked * 100) / 100, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_attendance"] }); toast({ title: "Attendance recorded" }); setOpen(false); setForm(emptyForm); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_attendance").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_attendance"] }); toast({ title: "Record deleted" }); },
  });

  const filtered = (attendance ?? []).filter(r => { const q = search.toLowerCase(); return !q || (r.hr_employees?.name || "").toLowerCase().includes(q); });
  const presentCount = filtered.filter(a => a.status === "present" || a.status === "late").length;
  const absentCount = filtered.filter(a => a.status === "absent").length;

  const statusColor: Record<string, string> = { present: "secondary", absent: "destructive", late: "outline", half_day: "outline", work_from_home: "secondary" };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="w-6 h-6 text-primary" /> Attendance</h1><p className="text-muted-foreground">Daily attendance tracking</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setForm(emptyForm); } else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Record Attendance</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Employee *</Label><Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{(employees ?? []).map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.employee_id})</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Date</Label><Input type="date" value={form.attendance_date} onChange={e => setForm({ ...form, attendance_date: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Check In</Label><Input type="time" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} /></div>
                  <div><Label>Check Out</Label><Input type="time" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} /></div>
                </div>
                <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ATT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={() => createAtt.mutate()} disabled={!form.employee_id} className="w-full">Record</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{presentCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{absentCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{filtered.length}</div></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-44" />
        </div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.hr_employees?.name}</TableCell><TableCell>{r.check_in || "—"}</TableCell><TableCell>{r.check_out || "—"}</TableCell><TableCell>{Number(r.hours_worked ?? 0).toFixed(1)}h</TableCell>
                  <TableCell><Badge variant={statusColor[r.status] as any} className="capitalize">{r.status?.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No attendance for this date</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
