import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Shield, AlertCircle, AlertTriangle, Info, CheckCircle2,
  TrendingUp, Loader2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineState } from "@/lib/engine";

interface QualityScorePanelProps {
  pipelineState: PipelineState | null;
  onAutoImprove?: () => void;
  isImproving?: boolean;
}

const SCORE_LABELS: Record<string, string> = {
  ui_completeness: "UI Completeness",
  backend_completeness: "Backend Completeness",
  security: "Security",
  test_coverage: "Test Coverage",
  performance: "Performance",
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-primary";
  if (score >= 70) return "text-chart-5";
  return "text-destructive";
};

const getScoreBg = (score: number) => {
  if (score >= 90) return "bg-primary/10";
  if (score >= 70) return "bg-chart-5/10";
  return "bg-destructive/10";
};

export function QualityScorePanel({ pipelineState, onAutoImprove, isImproving }: QualityScorePanelProps) {
  if (!pipelineState?.config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Quality Score</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Build something to see the quality analysis with auto-improvement.
          </p>
        </div>
      </div>
    );
  }

  const qs = pipelineState.qualityScore || {};
  const overall = qs.overall_score || 0;
  const issues = pipelineState.qualityIssues || [];
  const improvements = pipelineState.qualityImprovements || [];
  const verdict = pipelineState.qualityVerdict || "unknown";
  const validation = pipelineState.validation;

  const verdictConfig: Record<string, { label: string; color: string; bg: string }> = {
    pass: { label: "PASS", color: "text-primary", bg: "bg-primary/10" },
    needs_improvement: { label: "NEEDS IMPROVEMENT", color: "text-chart-5", bg: "bg-chart-5/10" },
    fail: { label: "FAIL", color: "text-destructive", bg: "bg-destructive/10" },
  };
  const vc = verdictConfig[verdict] || verdictConfig.needs_improvement;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* Overall Score */}
        <div className="flex items-center gap-4">
          <div className={cn("w-20 h-20 rounded-2xl flex flex-col items-center justify-center", getScoreBg(overall))}>
            <span className={cn("text-2xl font-bold", getScoreColor(overall))}>{overall}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">Quality Score</h3>
            <Badge className={cn("mt-1", vc.bg, vc.color, "border-0")}>{vc.label}</Badge>
            {overall < 90 && onAutoImprove && (
              <div className="mt-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onAutoImprove} disabled={isImproving}>
                  {isImproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isImproving ? "Improving..." : "Auto-Improve (AI)"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Score Breakdown</h4>
          {Object.entries(SCORE_LABELS).map(([key, label]) => {
            const score = qs[key] || 0;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={cn("font-semibold", getScoreColor(score))}>{score}</span>
                </div>
                <Progress value={score} className="h-1.5" />
              </div>
            );
          })}
        </div>

        {/* Security Validation */}
        {validation && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Security Validation: {validation.score}/100
            </h4>
            <div className="flex gap-2 text-xs">
              {validation.errors.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                  ❌ {validation.errors.length} errors
                </span>
              )}
              {validation.warnings.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-chart-5/10 text-chart-5">
                  ⚠️ {validation.warnings.length} warnings
                </span>
              )}
              {validation.errors.length === 0 && validation.warnings.length === 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> All clear
                </span>
              )}
            </div>
          </div>
        )}

        {/* Issues */}
        {issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Issues ({issues.length})</h4>
            {issues.map((issue: any, i: number) => (
              <div key={i} className={cn(
                "flex items-start gap-2 p-2.5 rounded-lg border text-xs",
                issue.severity === "error" ? "bg-destructive/5 border-destructive/20" :
                issue.severity === "warning" ? "bg-chart-5/5 border-chart-5/20" :
                "bg-muted/50 border-border"
              )}>
                {issue.severity === "error" ? <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" /> :
                 issue.severity === "warning" ? <AlertTriangle className="w-3.5 h-3.5 text-chart-5 mt-0.5 shrink-0" /> :
                 <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />}
                <div>
                  <p className="text-foreground">{issue.message}</p>
                  {issue.category && <p className="text-muted-foreground mt-0.5">Category: {issue.category}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Improvements */}
        {improvements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Recommended Improvements</h4>
            {improvements.map((imp: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-muted/30 text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">{imp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
