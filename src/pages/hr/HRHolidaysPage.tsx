import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Calendar, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

const emptyForm = { name: "", holiday_date: format(new Date(), "yyyy-MM-dd"), is_recurring: false };

export default function HRHolidaysPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["hr_holidays"], queryFn: async () => { const { data, error } = await supabase.from("hr_holidays").select("*").order("holiday_date"); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("hr_holidays").insert({ ...form, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_holidays"] }); toast({ title: "Holiday added" }); setOpen(false); setForm(emptyForm); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hr_holidays").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr_holidays"] }); toast({ title: "Holiday removed" }); },
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-primary" /> Holidays</h1><p className="text-muted-foreground">Manage public and company holidays</p></div>
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setForm(emptyForm); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Holiday</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Date *</Label><Input type="date" value={form.holiday_date} onChange={e => setForm({ ...form, holiday_date: e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_recurring} onCheckedChange={v => setForm({ ...form, is_recurring: v })} /><Label>Recurring yearly</Label></div>
                <Button onClick={() => create.mutate()} disabled={!form.name.trim()} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (holidays ?? []).length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Holiday</TableHead><TableHead>Date</TableHead><TableHead>Recurring</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{(holidays ?? []).map(r => (
                <TableRow key={r.id}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{format(new Date(r.holiday_date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>{r.is_recurring ? <Badge variant="secondary">Yearly</Badge> : "—"}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></TableCell></TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No Holidays</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
