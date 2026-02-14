import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Cpu, HardDrive, Clock, Zap, Circle,
  CheckCircle2, AlertTriangle, AlertCircle, TrendingUp,
  BarChart3, RefreshCw, Server, Globe, Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PipelineState } from "@/lib/engine/orchestrator";

interface MonitoringPanelProps {
  pipelineState: PipelineState | null;
  isBuilding: boolean;
}

interface HealthMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
  icon: any;
}

interface BuildMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  description: string;
}

export function MonitoringPanel({ pipelineState, isBuilding }: MonitoringPanelProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<"health" | "performance" | "errors">("health");
  const [buildStats, setBuildStats] = useState({ total: 0, success: 0, failed: 0, avgDuration: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) fetchBuildStats();
  }, [user]);

  const fetchBuildStats = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const { data } = await supabase
        .from("build_analytics")
        .select("status, duration_ms, security_score")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        const total = data.length;
        const success = data.filter(d => d.status === "success").length;
        const failed = data.filter(d => d.status === "error").length;
        const durations = data.filter(d => d.duration_ms).map(d => d.duration_ms!);
        const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
        setBuildStats({ total, success, failed, avgDuration });
      }
    } catch {}
    setIsRefreshing(false);
  };

  const healthMetrics: HealthMetric[] = [
    {
      label: "Build Pipeline",
      value: isBuilding ? 75 : (pipelineState?.stage === "complete" ? 100 : 0),
      max: 100,
      unit: "%",
      status: isBuilding ? "warning" : (pipelineState?.stage === "error" ? "critical" : "healthy"),
      icon: Zap,
    },
    {
      label: "Security Score",
      value: pipelineState?.validation?.score || 0,
      max: 100,
      unit: "/100",
      status: (pipelineState?.validation?.score || 0) >= 80 ? "healthy" : (pipelineState?.validation?.score || 0) >= 50 ? "warning" : "critical",
      icon: CheckCircle2,
    },
    {
      label: "Quality Score",
      value: pipelineState?.qualityScore?.overall_score || 0,
      max: 100,
      unit: "/100",
      status: (pipelineState?.qualityScore?.overall_score || 0) >= 90 ? "healthy" : (pipelineState?.qualityScore?.overall_score || 0) >= 70 ? "warning" : "critical",
      icon: TrendingUp,
    },
    {
      label: "Risk Level",
      value: pipelineState?.riskScore || 0,
      max: 100,
      unit: "/100",
      status: (pipelineState?.riskScore || 0) <= 30 ? "healthy" : (pipelineState?.riskScore || 0) <= 60 ? "warning" : "critical",
      icon: AlertTriangle,
    },
  ];

  const buildMetrics: BuildMetric[] = [
    { label: "Total Builds", value: buildStats.total, trend: "up", description: "All time builds" },
    { label: "Success Rate", value: buildStats.total > 0 ? `${Math.round((buildStats.success / buildStats.total) * 100)}%` : "N/A", trend: "stable", description: "Successful builds" },
    { label: "Failed Builds", value: buildStats.failed, trend: buildStats.failed > 0 ? "down" : "stable", description: "Error builds" },
    { label: "Avg Duration", value: buildStats.avgDuration > 0 ? `${(buildStats.avgDuration / 1000).toFixed(1)}s` : "N/A", trend: "stable", description: "Build time average" },
    { label: "Pages Generated", value: pipelineState?.config?.pages?.length || 0, description: "Current build" },
    { label: "Collections", value: pipelineState?.config?.collections?.length || 0, description: "Current build" },
    { label: "Agents Used", value: pipelineState?.agentLog?.length || 0, description: "Pipeline agents" },
    { label: "Auto-Fixes", value: pipelineState?.autoFixes?.length || 0, description: "Applied fixes" },
  ];

  const currentErrors = [
    ...(pipelineState?.validation?.errors || []).map(e => ({ severity: "error" as const, message: e.message, category: e.category })),
    ...(pipelineState?.validation?.warnings || []).map(w => ({ severity: "warning" as const, message: w.message, category: w.category })),
    ...(pipelineState?.bugs || []).map((b: any) => ({ severity: "error" as const, message: b.description || b, category: "Bug" })),
  ];

  const getStatusColor = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy": return "text-primary";
      case "warning": return "text-chart-5";
      case "critical": return "text-destructive";
    }
  };

  const getStatusBg = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy": return "bg-primary";
      case "warning": return "bg-chart-5";
      case "critical": return "bg-destructive";
    }
  };

  const views = [
    { key: "health", label: "Health", icon: Activity },
    { key: "performance", label: "Performance", icon: BarChart3 },
    { key: "errors", label: "Errors", icon: AlertCircle, count: currentErrors.length },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">System Monitor</span>
          <Badge
            variant={isBuilding ? "default" : "secondary"}
            className={cn("text-[10px] gap-1", isBuilding && "animate-pulse")}
          >
            <Circle className={cn("w-2 h-2", isBuilding ? "fill-primary-foreground" : "fill-primary")} />
            {isBuilding ? "Building" : "Idle"}
          </Badge>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={fetchBuildStats}
          disabled={isRefreshing}
          className="gap-1 h-7 text-xs"
        >
          <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* View tabs */}
      <div className="flex border-b border-border bg-card/50 shrink-0">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setActiveView(v.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2",
              activeView === v.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <v.icon className="w-3.5 h-3.5" />
            {v.label}
            {"count" in v && v.count > 0 && (
              <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">{v.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {activeView === "health" && (
            <>
              {/* System status overview */}
              <div className="rounded-xl border border-border p-4 bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    pipelineState?.stage === "error" ? "bg-destructive/10" : "bg-primary/10"
                  )}>
                    <Server className={cn(
                      "w-5 h-5",
                      pipelineState?.stage === "error" ? "text-destructive" : "text-primary"
                    )} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">System Status</h3>
                    <p className="text-xs text-muted-foreground">
                      {pipelineState?.stage === "error" ? "Issues detected" :
                       pipelineState?.stage === "complete" ? "All systems operational" :
                       isBuilding ? "Build in progress..." : "Waiting for build"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Globe className="w-4 h-4 mx-auto text-primary mb-1" />
                    <span className="text-[10px] text-muted-foreground">Frontend</span>
                    <p className="text-xs font-medium text-foreground">React + Vite</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Server className="w-4 h-4 mx-auto text-chart-2 mb-1" />
                    <span className="text-[10px] text-muted-foreground">Backend</span>
                    <p className="text-xs font-medium text-foreground">Express</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Database className="w-4 h-4 mx-auto text-chart-3 mb-1" />
                    <span className="text-[10px] text-muted-foreground">Database</span>
                    <p className="text-xs font-medium text-foreground">MySQL</p>
                  </div>
                </div>
              </div>

              {/* Health metrics */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Health Metrics</h3>
                {healthMetrics.map(metric => (
                  <div key={metric.label} className="rounded-xl border border-border p-3 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <metric.icon className={cn("w-4 h-4", getStatusColor(metric.status))} />
                        <span className="text-xs font-medium text-foreground">{metric.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-sm font-bold", getStatusColor(metric.status))}>
                          {metric.value}{metric.unit}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[9px] capitalize",
                            metric.status === "healthy" && "bg-primary/10 text-primary",
                            metric.status === "warning" && "bg-chart-5/10 text-chart-5",
                            metric.status === "critical" && "bg-destructive/10 text-destructive",
                          )}
                        >
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                    <Progress
                      value={(metric.value / metric.max) * 100}
                      className={cn("h-1.5", metric.status === "critical" && "[&>div]:bg-destructive", metric.status === "warning" && "[&>div]:bg-chart-5")}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {activeView === "performance" && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Build Analytics</h3>
              <div className="grid grid-cols-2 gap-3">
                {buildMetrics.map(metric => (
                  <div key={metric.label} className="rounded-xl border border-border p-3 bg-card">
                    <span className="text-[11px] text-muted-foreground">{metric.label}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-lg font-bold text-foreground">{metric.value}</span>
                      {metric.trend && (
                        <TrendingUp className={cn(
                          "w-3.5 h-3.5",
                          metric.trend === "up" ? "text-primary" :
                          metric.trend === "down" ? "text-destructive rotate-180" :
                          "text-muted-foreground"
                        )} />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{metric.description}</span>
                  </div>
                ))}
              </div>

              {/* Agent performance */}
              {pipelineState?.agentLog && pipelineState.agentLog.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Performance</h3>
                  {pipelineState.agentLog.map((agent, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <Cpu className="w-3 h-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-foreground truncate block">{agent.agent}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">Step {agent.step}</Badge>
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeView === "errors" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Issues ({currentErrors.length})
                </h3>
                {currentErrors.length > 0 && (
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive">
                      {currentErrors.filter(e => e.severity === "error").length} errors
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] bg-chart-5/10 text-chart-5">
                      {currentErrors.filter(e => e.severity === "warning").length} warnings
                    </Badge>
                  </div>
                )}
              </div>

              {currentErrors.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No issues found</p>
                  <p className="text-xs text-muted-foreground">Your build is clean!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentErrors.map((err, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-2.5 p-3 rounded-xl border",
                        err.severity === "error" ? "bg-destructive/5 border-destructive/20" : "bg-chart-5/5 border-chart-5/20"
                      )}
                    >
                      {err.severity === "error"
                        ? <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-chart-5 mt-0.5 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground">{err.message}</p>
                        {err.category && (
                          <Badge variant="secondary" className="text-[9px] mt-1">{err.category}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
