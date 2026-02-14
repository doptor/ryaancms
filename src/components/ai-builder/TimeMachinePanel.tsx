import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, Loader2, RotateCcw, Eye, ChevronRight,
  GitCommit, ArrowDownToLine, Diff, Calendar,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TimeMachinePanelProps {
  onRestoreSnapshot: (snapshot: any) => void;
}

interface BuildSnapshot {
  id: string;
  prompt: string;
  project_title: string | null;
  status: string;
  created_at: string;
  duration_ms: number | null;
  security_score: number | null;
  page_count: number | null;
  collection_count: number | null;
  component_count: number | null;
  components_used: any;
}

export function TimeMachinePanel({ onRestoreSnapshot }: TimeMachinePanelProps) {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<BuildSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [viewMode, setViewMode] = useState<"timeline" | "compare">("timeline");

  const fetchSnapshots = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("build_analytics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setSnapshots(data || []);
    } catch (err: any) {
      toast({ title: "Failed to load snapshots", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [user]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatRelative = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const toggleCompare = (id: string) => {
    setCompareIds(([a, b]) => {
      if (a === id) return [b, null];
      if (b === id) return [a, null];
      if (!a) return [id, b];
      if (!b) return [a, id];
      return [id, null]; // Reset if both set
    });
  };

  const compareA = snapshots.find((s) => s.id === compareIds[0]);
  const compareB = snapshots.find((s) => s.id === compareIds[1]);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Time Machine</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Sign in to access version history and rollback.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
          <p className="text-sm text-muted-foreground">Loading version history...</p>
        </div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Versions Yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build something to start tracking versions automatically.</p>
        </div>
      </div>
    );
  }

  // Group snapshots by date
  const grouped: Record<string, BuildSnapshot[]> = {};
  for (const s of snapshots) {
    const day = new Date(s.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(s);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Time Machine ({snapshots.length} versions)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("timeline")}
              className={cn("px-2.5 py-1 text-[11px] font-medium transition-colors",
                viewMode === "timeline" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={cn("px-2.5 py-1 text-[11px] font-medium transition-colors",
                viewMode === "compare" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )}
            >
              Compare
            </button>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={fetchSnapshots}>
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {viewMode === "timeline" ? (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {Object.entries(grouped).map(([day, items]) => (
              <div key={day} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">{day}</span>
                  <Badge variant="secondary" className="text-[10px] h-4">{items.length}</Badge>
                </div>
                <div className="relative ml-2 border-l-2 border-border pl-4 space-y-3">
                  {items.map((snap) => {
                    const isExpanded = selectedId === snap.id;
                    return (
                      <div key={snap.id} className="relative">
                        {/* Timeline dot */}
                        <div className={cn(
                          "absolute -left-[1.375rem] top-3 w-3 h-3 rounded-full border-2",
                          snap.status === "success"
                            ? "bg-primary border-primary"
                            : "bg-destructive border-destructive"
                        )} />
                        <div className={cn(
                          "rounded-xl border bg-card overflow-hidden transition-all",
                          isExpanded ? "border-primary" : "border-border hover:border-primary/30"
                        )}>
                          <button
                            onClick={() => setSelectedId(isExpanded ? null : snap.id)}
                            className="w-full flex items-center gap-3 p-3 text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {snap.project_title || "Untitled"}
                                </p>
                                <Badge
                                  variant={snap.status === "success" ? "secondary" : "destructive"}
                                  className="text-[10px] h-4 shrink-0"
                                >
                                  {snap.status}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{snap.prompt}</p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                <span>{formatRelative(snap.created_at)}</span>
                                <span>⏱ {formatDuration(snap.duration_ms)}</span>
                                {snap.security_score && <span>🔐 {snap.security_score}/100</span>}
                              </div>
                            </div>
                            <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                          </button>

                          {isExpanded && (
                            <div className="px-3 pb-3 border-t border-border pt-2 space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-lg bg-muted/50 p-2 text-center">
                                  <p className="text-lg font-bold text-foreground">{snap.page_count || 0}</p>
                                  <p className="text-[10px] text-muted-foreground">Pages</p>
                                </div>
                                <div className="rounded-lg bg-muted/50 p-2 text-center">
                                  <p className="text-lg font-bold text-foreground">{snap.collection_count || 0}</p>
                                  <p className="text-[10px] text-muted-foreground">Tables</p>
                                </div>
                                <div className="rounded-lg bg-muted/50 p-2 text-center">
                                  <p className="text-lg font-bold text-foreground">{snap.component_count || 0}</p>
                                  <p className="text-[10px] text-muted-foreground">Components</p>
                                </div>
                              </div>
                              {snap.components_used && Array.isArray(snap.components_used) && snap.components_used.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {(snap.components_used as string[]).slice(0, 12).map((c, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px]">{c}</Badge>
                                  ))}
                                  {(snap.components_used as string[]).length > 12 && (
                                    <Badge variant="secondary" className="text-[10px]">+{(snap.components_used as string[]).length - 12}</Badge>
                                  )}
                                </div>
                              )}
                              <Button
                                size="sm" variant="outline" className="w-full gap-1.5 text-xs h-8"
                                onClick={() => {
                                  onRestoreSnapshot(snap);
                                  toast({ title: "Snapshot info loaded", description: `Viewing "${snap.project_title}" build details.` });
                                }}
                              >
                                <ArrowDownToLine className="w-3 h-3" /> Restore this version
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        /* Compare Mode */
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-3 border-b border-border bg-muted/30 space-y-2 shrink-0">
            <p className="text-xs text-muted-foreground">Select two versions to compare side-by-side:</p>
            <ScrollArea className="max-h-40">
              <div className="space-y-1">
                {snapshots.map((snap) => {
                  const isA = compareIds[0] === snap.id;
                  const isB = compareIds[1] === snap.id;
                  return (
                    <button
                      key={snap.id}
                      onClick={() => toggleCompare(snap.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-all",
                        isA ? "bg-primary/10 border border-primary text-primary" :
                        isB ? "bg-chart-5/10 border border-chart-5 text-chart-5" :
                        "text-muted-foreground hover:bg-accent border border-transparent"
                      )}
                    >
                      {isA && <Badge className="text-[10px] h-4 bg-primary text-primary-foreground">A</Badge>}
                      {isB && <Badge className="text-[10px] h-4 bg-chart-5 text-chart-5-foreground">B</Badge>}
                      <span className="truncate flex-1">{snap.project_title || "Untitled"}</span>
                      <span className="text-[10px] shrink-0">{formatRelative(snap.created_at)}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {compareA && compareB ? (
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Header */}
                  <div className="rounded-xl border border-primary bg-primary/5 p-3">
                    <Badge className="text-[10px] bg-primary text-primary-foreground mb-1">A</Badge>
                    <p className="text-sm font-medium text-foreground truncate">{compareA.project_title}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(compareA.created_at)}</p>
                  </div>
                  <div className="rounded-xl border border-chart-5 bg-chart-5/5 p-3">
                    <Badge className="text-[10px] bg-chart-5 text-chart-5-foreground mb-1">B</Badge>
                    <p className="text-sm font-medium text-foreground truncate">{compareB.project_title}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(compareB.created_at)}</p>
                  </div>

                  {/* Metrics comparison */}
                  {[
                    { label: "Pages", a: compareA.page_count, b: compareB.page_count },
                    { label: "Tables", a: compareA.collection_count, b: compareB.collection_count },
                    { label: "Components", a: compareA.component_count, b: compareB.component_count },
                    { label: "Security", a: compareA.security_score, b: compareB.security_score },
                    { label: "Build Time", a: compareA.duration_ms, b: compareB.duration_ms, format: "duration" },
                  ].map((metric) => {
                    const aVal = metric.a ?? 0;
                    const bVal = metric.b ?? 0;
                    const diff = bVal - aVal;
                    const formatVal = (v: number) =>
                      metric.format === "duration" ? formatDuration(v) : String(v);
                    return (
                      <div key={metric.label} className="col-span-2 grid grid-cols-3 items-center rounded-lg border border-border p-2">
                        <div className="text-right pr-3">
                          <span className="text-sm font-bold text-foreground">{formatVal(aVal)}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-muted-foreground block">{metric.label}</span>
                          {diff !== 0 && (
                            <span className={cn("text-[10px] font-medium",
                              metric.format === "duration"
                                ? (diff < 0 ? "text-primary" : "text-destructive")
                                : (diff > 0 ? "text-primary" : "text-destructive")
                            )}>
                              {diff > 0 ? "+" : ""}{metric.format === "duration" ? formatDuration(diff) : diff}
                            </span>
                          )}
                        </div>
                        <div className="pl-3">
                          <span className="text-sm font-bold text-foreground">{formatVal(bVal)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-2">
                <Diff className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Select two versions above to compare</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
