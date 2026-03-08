import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Phone, Plus, CheckCircle } from "lucide-react";

const TYPES = ["call", "meeting", "email", "follow_up", "task"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const priorityColor: Record<string, string> = {
  low: "bg-gray-100 text-gray-700", medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700", urgent: "bg-red-100 text-red-700",
};

export default function CRMActivitiesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "task", priority: "medium", due_date: "", description: "" });

  const { data: activities, isLoading } = useQuery({
    queryKey: ["crm-activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_activities").select("*").order("due_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_activities").insert({
        ...form, due_date: form.due_date ? new Date(form.due_date).toISOString() : null, user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
      toast({ title: "Activity created" });
      setForm({ title: "", type: "task", priority: "medium", due_date: "", description: "" });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_activities").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
      toast({ title: "Activity completed" });
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Phone className="w-6 h-6 text-primary" /> Activities</h1>
            <p className="text-muted-foreground">Tasks, calls, meetings & follow-ups</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Activity</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Activity</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Due Date</Label><Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <Button onClick={() => createMutation.mutate()} disabled={!form.title.trim()} className="w-full">Create Activity</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {(activities ?? []).map((a) => (
            <Card key={a.id} className={a.status === "completed" ? "opacity-60" : ""}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" disabled={a.status === "completed"} onClick={() => completeMutation.mutate(a.id)}>
                    <CheckCircle className={`w-5 h-5 ${a.status === "completed" ? "text-green-500" : "text-muted-foreground"}`} />
                  </Button>
                  <div>
                    <p className={`font-medium ${a.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>{a.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.type?.replace("_", " ")} · {a.due_date ? new Date(a.due_date).toLocaleDateString() : "No date"}</p>
                  </div>
                </div>
                <Badge variant="outline" className={priorityColor[a.priority ?? "medium"]}>{a.priority}</Badge>
              </CardContent>
            </Card>
          ))}
          {(activities ?? []).length === 0 && !isLoading && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No activities. Create one to start tracking.</CardContent></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
