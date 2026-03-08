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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Phone, Plus, CheckCircle, Pencil, Trash2 } from "lucide-react";

const TYPES = ["call", "meeting", "email", "follow_up", "task"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["pending", "completed", "cancelled"];

const priorityColor: Record<string, string> = {
  low: "bg-gray-100 text-gray-700", medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700", urgent: "bg-red-100 text-red-700",
};

const emptyForm = { title: "", type: "task", priority: "medium", due_date: "", description: "", related_type: "", related_id: "" };

export default function CRMActivitiesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const { data: activities, isLoading } = useQuery({
    queryKey: ["crm-activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_activities").select("*").order("due_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: deals } = useQuery({
    queryKey: ["crm-deals-list"],
    queryFn: async () => { const { data } = await supabase.from("crm_deals").select("id, title"); return data ?? []; },
    enabled: !!user,
  });

  const { data: leads } = useQuery({
    queryKey: ["crm-leads-list"],
    queryFn: async () => { const { data } = await supabase.from("crm_leads").select("id, name"); return data ?? []; },
    enabled: !!user,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        related_type: form.related_type || null,
        related_id: form.related_id || null,
      };
      if (editId) {
        const { error } = await supabase.from("crm_activities").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crm_activities").insert({ ...payload, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
      toast({ title: editId ? "Activity updated" : "Activity created" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_activities").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-activities"] }); toast({ title: "Activity completed" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("crm_activities").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-activities"] }); toast({ title: "Activity deleted" }); },
  });

  const resetForm = () => { setForm(emptyForm); setEditId(null); setOpen(false); };

  const openEdit = (a: any) => {
    setForm({
      title: a.title, type: a.type || "task", priority: a.priority || "medium",
      due_date: a.due_date ? new Date(a.due_date).toISOString().slice(0, 16) : "",
      description: a.description || "", related_type: a.related_type || "", related_id: a.related_id || "",
    });
    setEditId(a.id); setOpen(true);
  };

  const relatedOptions = form.related_type === "deal" ? (deals ?? []).map(d => ({ id: d.id, label: d.title }))
    : form.related_type === "lead" ? (leads ?? []).map(l => ({ id: l.id, label: l.name })) : [];

  const filtered = (activities ?? []).filter(a => {
    const matchType = filterType === "all" || a.type === filterType;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchType && matchStatus;
  });

  const pendingCount = (activities ?? []).filter(a => a.status === "pending").length;
  const overdueCount = (activities ?? []).filter(a => a.status === "pending" && a.due_date && new Date(a.due_date) < new Date()).length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Phone className="w-6 h-6 text-primary" /> Activities</h1>
            <p className="text-muted-foreground">{pendingCount} pending · {overdueCount} overdue</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Activity</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Activity" : "New Activity"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Due Date</Label><Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Related To</Label>
                    <Select value={form.related_type} onValueChange={(v) => setForm({ ...form, related_type: v, related_id: "" })}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="deal">Deal</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.related_type && (
                    <div><Label>Select {form.related_type}</Label>
                      <Select value={form.related_id} onValueChange={(v) => setForm({ ...form, related_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{relatedOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                <Button onClick={() => upsertMutation.mutate()} disabled={!form.title.trim()} className="w-full">
                  {editId ? "Update Activity" : "Create Activity"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map((a) => {
            const isOverdue = a.status === "pending" && a.due_date && new Date(a.due_date) < new Date();
            return (
              <Card key={a.id} className={a.status === "completed" ? "opacity-60" : isOverdue ? "border-destructive/50" : ""}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button variant="ghost" size="icon" disabled={a.status === "completed"} onClick={() => completeMutation.mutate(a.id)}>
                      <CheckCircle className={`w-5 h-5 ${a.status === "completed" ? "text-green-500" : "text-muted-foreground"}`} />
                    </Button>
                    <div className="min-w-0">
                      <p className={`font-medium ${a.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>{a.title}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="capitalize">{a.type?.replace("_", " ")}</span>
                        {a.due_date && <span className={isOverdue ? "text-destructive font-medium" : ""}>· {new Date(a.due_date).toLocaleDateString()}</span>}
                        {a.related_type && <span>· {a.related_type}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={priorityColor[a.priority ?? "medium"]}>{a.priority}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && !isLoading && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No activities. Create one to start tracking.</CardContent></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
