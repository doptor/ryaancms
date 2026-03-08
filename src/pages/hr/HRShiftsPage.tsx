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
import { Plus, Clock, Trash2, Loader2, CalendarRange, RefreshCw } from "lucide-react";
import { format, addDays } from "date-fns";

const emptyShiftForm = { name: "", start_time: "09:00", end_time: "17:00", break_duration: "60", color: "#3b82f6" };
const emptyAssignForm = { employee_id: "", shift_id: "", assignment_date: format(new Date(), "yyyy-MM-dd"), overtime_hours: "0" };

export default function HRShiftsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [shiftOpen, setShiftOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [shiftForm, setShiftForm] = useState(emptyShiftForm);
  const [assignForm, setAssignForm] = useState(emptyAssignForm);

  const { data: shifts } = useQuery({
    queryKey: ["hr_shifts"], queryFn: async () => { const { data, error } = await supabase.from("hr_shifts").select("*").order("name"); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["hr_shift_assignments", filterDate], queryFn: async () => {
      const weekEnd = format(addDays(new Date(filterDate), 6), "yyyy-MM-dd");
      const { data, error } = await supabase.from("hr_shift_assignments").select("*, hr_employees!hr_shift_assignments_employee_id_fkey(name, employee_id), hr_shifts(name, start_time, end_time, color)").gte("assignment_date", filterDate).lte("assignment_date", weekEnd).order("assignment_date");
      if (error) throw error; return data ?? [];
    }, enabled: !!user,
  });
  const { data: employees } = useQuery({ queryKey: ["hr_emp_shift"], queryFn: async () => { const { data } = await supabase.from("hr_employees").select("id, name, employee_id").eq("status", "active"); return data ?? []; }, enabled: !!user });

  const createShift = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("hr_shifts").insert({ ...shiftForm, break_duration: parseInt(shiftForm.break_duration) || 60, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_shifts"] }); toast({ title: "Shift created" }); setShiftOpen(false); setShiftForm(emptyShiftForm); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const assignShift = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("hr_shift_assignments").insert({ employee_id: assignForm.employee_id, shift_id: assignForm.shift_id, assignment_date: assignForm.assignment_date, overtime_hours: parseFloat(assignForm.overtime_hours) || 0, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_shift_assignments"] }); toast({ title: "Shift assigned" }); setAssignOpen(false); setAssignForm(emptyAssignForm); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const requestSwap = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_shift_assignments").update({ swap_requested: true, status: "swap_pending" }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_shift_assignments"] }); toast({ title: "Swap requested" }); },
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_shift_assignments").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_shift_assignments"] }); toast({ title: "Assignment removed" }); },
  });

  const deleteShift = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_shifts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_shifts"] }); toast({ title: "Shift deleted" }); },
  });

  const totalOvertime = (assignments ?? []).reduce((s, a) => s + Number(a.overtime_hours ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><CalendarRange className="w-6 h-6 text-primary" /> Shift Scheduling</h1><p className="text-muted-foreground">Manage shifts, rosters & overtime</p></div>
          <div className="flex gap-2">
            <Dialog open={shiftOpen} onOpenChange={v => { setShiftOpen(v); if (!v) setShiftForm(emptyShiftForm); }}>
              <DialogTrigger asChild><Button variant="outline"><Clock className="w-4 h-4 mr-2" />Manage Shifts</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Shift Types</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  {(shifts ?? []).map(s => (
                    <div key={s.id} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || "#3b82f6" }} /><span className="font-medium">{s.name}</span><span className="text-xs text-muted-foreground">{s.start_time}–{s.end_time}</span></div>
                      <Button size="sm" variant="ghost" onClick={() => deleteShift.mutate(s.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  ))}
                  <div className="border-t pt-3 space-y-2">
                    <Input placeholder="Shift name (e.g., Morning)" value={shiftForm.name} onChange={e => setShiftForm({ ...shiftForm, name: e.target.value })} />
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="time" value={shiftForm.start_time} onChange={e => setShiftForm({ ...shiftForm, start_time: e.target.value })} />
                      <Input type="time" value={shiftForm.end_time} onChange={e => setShiftForm({ ...shiftForm, end_time: e.target.value })} />
                      <Input type="color" value={shiftForm.color} onChange={e => setShiftForm({ ...shiftForm, color: e.target.value })} className="p-1 h-10" />
                    </div>
                    <Button size="sm" onClick={() => createShift.mutate()} disabled={!shiftForm.name.trim()} className="w-full">Add Shift</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={assignOpen} onOpenChange={v => { setAssignOpen(v); if (!v) setAssignForm(emptyAssignForm); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Assign Shift</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assign Shift</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Employee *</Label><Select value={assignForm.employee_id} onValueChange={v => setAssignForm({ ...assignForm, employee_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(employees ?? []).map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Shift *</Label><Select value={assignForm.shift_id} onValueChange={v => setAssignForm({ ...assignForm, shift_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(shifts ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.start_time}–{s.end_time})</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Date *</Label><Input type="date" value={assignForm.assignment_date} onChange={e => setAssignForm({ ...assignForm, assignment_date: e.target.value })} /></div>
                  <div><Label>Overtime Hours</Label><Input type="number" value={assignForm.overtime_hours} onChange={e => setAssignForm({ ...assignForm, overtime_hours: e.target.value })} /></div>
                  <Button onClick={() => assignShift.mutate()} disabled={!assignForm.employee_id || !assignForm.shift_id} className="w-full">Assign</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Assignments This Week</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(assignments ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Overtime</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{totalOvertime}h</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Shift Types</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(shifts ?? []).length}</div></CardContent></Card>
        </div>

        <div className="flex gap-3 items-center">
          <Label>Week starting:</Label>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-44" />
        </div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (assignments ?? []).length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Shift</TableHead><TableHead>Time</TableHead><TableHead>Overtime</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{(assignments ?? []).map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.hr_employees?.name}</TableCell>
                  <TableCell>{format(new Date(r.assignment_date), "EEE, MMM dd")}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.hr_shifts?.color || "#3b82f6" }} />{r.hr_shifts?.name}</div></TableCell>
                  <TableCell className="text-sm">{r.hr_shifts?.start_time}–{r.hr_shifts?.end_time}</TableCell>
                  <TableCell>{Number(r.overtime_hours ?? 0) > 0 ? <Badge variant="outline">{r.overtime_hours}h OT</Badge> : "—"}</TableCell>
                  <TableCell><Badge variant={r.status === "swap_pending" ? "destructive" : "secondary"} className="capitalize">{(r.status || "assigned").replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end">
                    {r.status === "assigned" && <Button size="sm" variant="outline" onClick={() => requestSwap.mutate(r.id)} title="Request swap"><RefreshCw className="w-3.5 h-3.5" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remove?")) deleteAssignment.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div></TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><CalendarRange className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Shift Assignments</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
