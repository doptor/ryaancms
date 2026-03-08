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
import { Plus, ClipboardList, Search, Trash2, Loader2, CheckCircle, UserMinus, UserPlus, ListChecks } from "lucide-react";
import { format } from "date-fns";

const emptyTaskForm = { employee_id: "", type: "onboarding", task_name: "", description: "", due_date: "" };
const emptyTemplateForm = { name: "", type: "onboarding", items: "" };

export default function HROnboardingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [taskOpen, setTaskOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("onboarding");
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["hr_onboarding_tasks"], queryFn: async () => { const { data, error } = await supabase.from("hr_onboarding_tasks").select("*, hr_employees(name, employee_id)").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: templates } = useQuery({
    queryKey: ["hr_onboarding_templates"], queryFn: async () => { const { data } = await supabase.from("hr_onboarding_templates").select("*").order("name"); return data ?? []; }, enabled: !!user,
  });
  const { data: employees } = useQuery({ queryKey: ["hr_emp_onboard"], queryFn: async () => { const { data } = await supabase.from("hr_employees").select("id, name, employee_id"); return data ?? []; }, enabled: !!user });

  const createTask = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("hr_onboarding_tasks").insert({ employee_id: taskForm.employee_id, type: taskForm.type, task_name: taskForm.task_name, description: taskForm.description || null, due_date: taskForm.due_date || null, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_onboarding_tasks"] }); toast({ title: "Task created" }); setTaskOpen(false); setTaskForm(emptyTaskForm); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const completeTask = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_onboarding_tasks").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_onboarding_tasks"] }); toast({ title: "Task completed" }); },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_onboarding_tasks").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_onboarding_tasks"] }); toast({ title: "Task removed" }); },
  });

  const createTemplate = useMutation({
    mutationFn: async () => {
      const items = templateForm.items.split("\n").filter(i => i.trim()).map(i => ({ name: i.trim(), completed: false }));
      const { error } = await supabase.from("hr_onboarding_templates").insert({ name: templateForm.name, type: templateForm.type, items, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_onboarding_templates"] }); toast({ title: "Template created" }); setTemplateOpen(false); setTemplateForm(emptyTemplateForm); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const applyTemplate = useMutation({
    mutationFn: async ({ templateId, employeeId }: { templateId: string; employeeId: string }) => {
      const template = (templates ?? []).find(t => t.id === templateId);
      if (!template) throw new Error("Template not found");
      const items = (template.items as any[]) || [];
      const tasksToInsert = items.map((item: any) => ({ employee_id: employeeId, type: template.type, task_name: item.name, template_id: templateId, user_id: user!.id }));
      if (tasksToInsert.length === 0) throw new Error("Template has no items");
      const { error } = await supabase.from("hr_onboarding_tasks").insert(tasksToInsert);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_onboarding_tasks"] }); toast({ title: "Template applied — tasks created!" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const [applyForm, setApplyForm] = useState({ templateId: "", employeeId: "" });
  const [applyOpen, setApplyOpen] = useState(false);

  const filtered = (tasks ?? []).filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.task_name.toLowerCase().includes(q) || (r.hr_employees?.name || "").toLowerCase().includes(q);
    const matchType = r.type === tab;
    return matchSearch && matchType;
  });

  const pendingCount = filtered.filter(t => t.status === "pending").length;
  const completedCount = filtered.filter(t => t.status === "completed").length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6 text-primary" /> Onboarding / Offboarding</h1><p className="text-muted-foreground">Checklists, tasks & templates for employee transitions</p></div>
          <div className="flex gap-2">
            <Dialog open={templateOpen} onOpenChange={v => { setTemplateOpen(v); if (!v) setTemplateForm(emptyTemplateForm); }}>
              <DialogTrigger asChild><Button variant="outline"><ListChecks className="w-4 h-4 mr-2" />Templates</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Checklist Templates</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  {(templates ?? []).map(t => <div key={t.id} className="flex justify-between items-center p-2 border rounded"><div><span className="font-medium">{t.name}</span><Badge variant="outline" className="ml-2 capitalize">{t.type}</Badge></div><span className="text-xs text-muted-foreground">{((t.items as any[]) || []).length} items</span></div>)}
                  <div className="border-t pt-3 space-y-2">
                    <Input placeholder="Template name" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} />
                    <Select value={templateForm.type} onValueChange={v => setTemplateForm({ ...templateForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="onboarding">Onboarding</SelectItem><SelectItem value="offboarding">Offboarding</SelectItem></SelectContent></Select>
                    <Textarea placeholder="One task per line..." value={templateForm.items} onChange={e => setTemplateForm({ ...templateForm, items: e.target.value })} rows={4} />
                    <Button size="sm" onClick={() => createTemplate.mutate()} disabled={!templateForm.name.trim() || !templateForm.items.trim()} className="w-full">Create Template</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={applyOpen} onOpenChange={v => { setApplyOpen(v); if (!v) setApplyForm({ templateId: "", employeeId: "" }); }}>
              <DialogTrigger asChild><Button variant="outline">Apply Template</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Apply Template to Employee</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Template *</Label><Select value={applyForm.templateId} onValueChange={v => setApplyForm({ ...applyForm, templateId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(templates ?? []).map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.type})</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Employee *</Label><Select value={applyForm.employeeId} onValueChange={v => setApplyForm({ ...applyForm, employeeId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(employees ?? []).map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                  <Button onClick={() => applyTemplate.mutate({ templateId: applyForm.templateId, employeeId: applyForm.employeeId })} disabled={!applyForm.templateId || !applyForm.employeeId} className="w-full">Apply</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={taskOpen} onOpenChange={v => { setTaskOpen(v); if (!v) setTaskForm(emptyTaskForm); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Task</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Employee *</Label><Select value={taskForm.employee_id} onValueChange={v => setTaskForm({ ...taskForm, employee_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(employees ?? []).map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Type</Label><Select value={taskForm.type} onValueChange={v => setTaskForm({ ...taskForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="onboarding">Onboarding</SelectItem><SelectItem value="offboarding">Offboarding</SelectItem></SelectContent></Select></div>
                  <div><Label>Task Name *</Label><Input value={taskForm.task_name} onChange={e => setTaskForm({ ...taskForm, task_name: e.target.value })} /></div>
                  <div><Label>Due Date</Label><Input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} /></div>
                  <div><Label>Description</Label><Textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={2} /></div>
                  <Button onClick={() => createTask.mutate()} disabled={!taskForm.employee_id || !taskForm.task_name.trim()} className="w-full">Add Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{pendingCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{completedCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Templates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(templates ?? []).length}</div></CardContent></Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="onboarding" className="gap-1"><UserPlus className="w-4 h-4" />Onboarding</TabsTrigger>
            <TabsTrigger value="offboarding" className="gap-1"><UserMinus className="w-4 h-4" />Offboarding</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Task</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.hr_employees?.name}</TableCell>
                  <TableCell>{r.task_name}<br />{r.description && <span className="text-xs text-muted-foreground">{r.description}</span>}</TableCell>
                  <TableCell>{r.due_date ? format(new Date(r.due_date), "MMM dd") : "—"}</TableCell>
                  <TableCell><Badge variant={r.status === "completed" ? "secondary" : "outline"} className="capitalize gap-1">{r.status === "completed" && <CheckCircle className="w-3 h-3" />}{r.status}</Badge></TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end">
                    {r.status !== "completed" && <Button size="sm" variant="outline" onClick={() => completeTask.mutate(r.id)}><CheckCircle className="w-3.5 h-3.5" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteTask.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div></TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No {tab} tasks</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
