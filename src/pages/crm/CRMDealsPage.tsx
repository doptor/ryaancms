import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Target, Plus, DollarSign } from "lucide-react";

const statusColor: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

export default function CRMDealsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", value: "", expected_close_date: "", notes: "" });

  const { data: deals, isLoading } = useQuery({
    queryKey: ["crm-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_deals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_deals").insert({
        title: form.title,
        value: parseFloat(form.value) || 0,
        expected_close_date: form.expected_close_date || null,
        notes: form.notes,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-deals"] });
      toast({ title: "Deal created" });
      setForm({ title: "", value: "", expected_close_date: "", notes: "" });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalValue = (deals ?? []).reduce((s, d) => s + Number(d.value ?? 0), 0);
  const wonValue = (deals ?? []).filter((d) => d.status === "won").reduce((s, d) => s + Number(d.value ?? 0), 0);
  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6 text-primary" /> Deals</h1>
            <p className="text-muted-foreground">Sales pipeline & opportunities</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Deal</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Deal</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Value ($)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
                <div><Label>Expected Close Date</Label><Input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} /></div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={() => createMutation.mutate()} disabled={!form.title.trim()} className="w-full">Create Deal</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Pipeline</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(totalValue)}</div><p className="text-xs text-muted-foreground">{(deals ?? []).length} deals</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Won Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{fmt(wonValue)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Open Deals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(deals ?? []).filter((d) => d.status === "open").length}</div></CardContent></Card>
        </div>

        <div className="grid gap-4">
          {(deals ?? []).map((d) => (
            <Card key={d.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted"><DollarSign className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">{d.title}</p>
                    <p className="text-sm text-muted-foreground">{d.expected_close_date ? `Close: ${d.expected_close_date}` : "No close date"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{fmt(Number(d.value ?? 0))}</span>
                  <Badge variant="outline" className={statusColor[d.status ?? "open"]}>{d.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {(deals ?? []).length === 0 && !isLoading && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No deals yet. Create your first deal to get started.</CardContent></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
