import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2, XCircle, Clock, Shield, Eye,
  ChevronDown, ChevronUp, Rocket,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: approvals = [] } = useQuery({
    queryKey: ["deploy-approvals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deploy_approvals")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateApproval = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("deploy_approvals")
        .update({
          status,
          reviewer_notes: notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deploy-approvals"] });
      toast({ title: "Approval updated" });
    },
  });

  const deleteApproval = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deploy_approvals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deploy-approvals"] });
      toast({ title: "Approval deleted" });
    },
  });

  const pendingCount = approvals.filter((a: any) => a.status === "pending").length;
  const approvedCount = approvals.filter((a: any) => a.status === "approved").length;
  const rejectedCount = approvals.filter((a: any) => a.status === "rejected").length;

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle2 className="w-4 h-4 text-primary" />;
    if (status === "rejected") return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-primary/10 text-primary border-primary/20">Approved</Badge>;
    if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <DashboardLayout>
      <ScrollArea className="h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> Deploy Approvals
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Review and approve configurations before deployment.</p>
          </div>

          {/* Summary */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{pendingCount}</span>
              <span className="text-muted-foreground">pending</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">{approvedCount}</span>
              <span className="text-muted-foreground">approved</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-foreground font-medium">{rejectedCount}</span>
              <span className="text-muted-foreground">rejected</span>
            </div>
          </div>

          {/* Approvals list */}
          {approvals.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Rocket className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No approvals yet</h3>
              <p className="text-sm text-muted-foreground">Submit a build for review from the AI Builder's Deploy tab.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((a: any) => {
                const isExpanded = expandedId === a.id;
                return (
                  <div key={a.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
                    >
                      {statusIcon(a.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.project_title}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(a.submitted_at).toLocaleDateString()}
                          {a.reviewed_at && ` · Reviewed ${new Date(a.reviewed_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      {statusBadge(a.status)}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border p-4 space-y-4">
                        {/* Config preview */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Configuration</h4>
                          <pre className="text-xs font-mono bg-muted rounded-lg p-3 max-h-48 overflow-auto text-foreground">
                            {JSON.stringify(a.config, null, 2)}
                          </pre>
                        </div>

                        {a.schema_sql && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase">SQL Schema</h4>
                            <pre className="text-xs font-mono bg-muted rounded-lg p-3 max-h-32 overflow-auto text-foreground">
                              {a.schema_sql}
                            </pre>
                          </div>
                        )}

                        {a.reviewer_notes && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Review Notes</h4>
                            <p className="text-sm text-foreground bg-muted rounded-lg p-3">{a.reviewer_notes}</p>
                          </div>
                        )}

                        {a.status === "pending" && (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Add review notes (optional)..."
                              value={reviewNotes[a.id] || ""}
                              onChange={(e) => setReviewNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
                              className="text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateApproval.mutate({ id: a.id, status: "approved", notes: reviewNotes[a.id] })}
                                className="gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateApproval.mutate({ id: a.id, status: "rejected", notes: reviewNotes[a.id] })}
                                className="gap-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteApproval.mutate(a.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </DashboardLayout>
  );
}
