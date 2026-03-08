import { useState, DragEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Columns3, Plus, DollarSign, GripVertical } from "lucide-react";

const DEFAULT_STAGES = [
  { name: "New Lead", slug: "new_lead", color: "#3b82f6", probability: 10 },
  { name: "Contacted", slug: "contacted", color: "#8b5cf6", probability: 20 },
  { name: "Qualified", slug: "qualified", color: "#f59e0b", probability: 40 },
  { name: "Proposal Sent", slug: "proposal", color: "#6366f1", probability: 60 },
  { name: "Negotiation", slug: "negotiation", color: "#ec4899", probability: 80 },
  { name: "Won", slug: "won", color: "#22c55e", probability: 100 },
  { name: "Lost", slug: "lost", color: "#ef4444", probability: 0 },
];

export default function CRMPipelinePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dragDealId, setDragDealId] = useState<string | null>(null);
  const [openDeal, setOpenDeal] = useState(false);
  const [form, setForm] = useState({ title: "", value: "", expected_close_date: "" });

  // Fetch or create default pipeline stages
  const { data: stages } = useQuery({
    queryKey: ["crm-pipeline-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .select("*")
        .order("sort_order");
      if (error) throw error;

      if (!data || data.length === 0) {
        // Seed default stages
        const inserts = DEFAULT_STAGES.map((s, i) => ({
          ...s,
          sort_order: i,
          user_id: user!.id,
        }));
        const { data: created, error: insertErr } = await supabase
          .from("crm_pipeline_stages")
          .insert(inserts)
          .select();
        if (insertErr) throw insertErr;
        return created ?? [];
      }
      return data;
    },
    enabled: !!user,
  });

  const { data: deals } = useQuery({
    queryKey: ["crm-pipeline-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_deals").select("*").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const createDeal = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase.from("crm_deals").insert({
        title: form.title,
        value: parseFloat(form.value) || 0,
        expected_close_date: form.expected_close_date || null,
        stage_id: stageId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-pipeline-deals"] });
      toast({ title: "Deal created" });
      setForm({ title: "", value: "", expected_close_date: "" });
      setOpenDeal(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const moveDeal = useMutation({
    mutationFn: async ({ dealId, stageId, status }: { dealId: string; stageId: string; status?: string }) => {
      const stage = (stages ?? []).find((s) => s.id === stageId);
      const { error } = await supabase.from("crm_deals").update({
        stage_id: stageId,
        probability: stage?.probability ?? 0,
        ...(status ? { status } : {}),
      }).eq("id", dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-pipeline-deals"] });
    },
  });

  const handleDragStart = (e: DragEvent, dealId: string) => {
    setDragDealId(dealId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: DragEvent, stageId: string, stageSlug: string) => {
    e.preventDefault();
    if (!dragDealId) return;
    const status = stageSlug === "won" ? "won" : stageSlug === "lost" ? "lost" : "open";
    moveDeal.mutate({ dealId: dragDealId, stageId, status });
    setDragDealId(null);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0 });
  const firstStageId = (stages ?? [])[0]?.id;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-full mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Columns3 className="w-6 h-6 text-primary" /> Sales Pipeline
            </h1>
            <p className="text-muted-foreground">Drag deals between stages</p>
          </div>
          <Dialog open={openDeal} onOpenChange={setOpenDeal}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />New Deal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Deal</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Value ($)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
                <div><Label>Expected Close</Label><Input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} /></div>
                <Button
                  onClick={() => firstStageId && createDeal.mutate(firstStageId)}
                  disabled={!form.title.trim() || !firstStageId}
                  className="w-full"
                >
                  Create Deal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
          {(stages ?? []).map((stage) => {
            const stageDeals = (deals ?? []).filter((d) => d.stage_id === stage.id);
            const stageValue = stageDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);

            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-[280px] flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id, stage.slug)}
              >
                {/* Stage Header */}
                <div
                  className="rounded-t-lg px-3 py-2 flex items-center justify-between"
                  style={{ backgroundColor: stage.color + "20", borderBottom: `3px solid ${stage.color}` }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="font-semibold text-sm text-foreground">{stage.name}</span>
                    <Badge variant="secondary" className="text-xs">{stageDeals.length}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{fmt(stageValue)}</span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                  {stageDeals.map((deal) => (
                    <Card
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                        dragDealId === deal.id ? "opacity-50" : ""
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{deal.title}</p>
                            {deal.expected_close_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Close: {deal.expected_close_date}
                              </p>
                            )}
                          </div>
                          <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-foreground flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />{fmt(Number(deal.value ?? 0))}
                          </span>
                          <span className="text-xs text-muted-foreground">{deal.probability ?? 0}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
                      Drop deals here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
