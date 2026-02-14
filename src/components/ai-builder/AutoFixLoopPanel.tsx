import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Wrench, Loader2, Play, RotateCcw, Bug, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineState } from "@/lib/engine";

interface AutoFixLoopPanelProps {
  pipelineState: PipelineState | null;
  onRetryBuild?: () => void;
  onApplyFixes?: () => void;
  isBuilding?: boolean;
}

export function AutoFixLoopPanel({ pipelineState, onRetryBuild, onApplyFixes, isBuilding }: AutoFixLoopPanelProps) {
  if (!pipelineState?.config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Auto-Fix Loop</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Build something first. The auto-fix loop will catch and fix errors automatically.
          </p>
        </div>
      </div>
    );
  }

  const errors = pipelineState.bugs || [];
  const fixes = pipelineState.autoFixes || [];
  const errorMemory = pipelineState.errorFixMemory || [];
  const riskScore = pipelineState.riskScore || 0;

  const totalAttempts = Math.max(errors.length, 1);
  const fixedCount = fixes.length;
  const unfixedCount = Math.max(errors.length - fixes.length, 0);
  const loopStatus = errors.length === 0 ? "success" : fixes.length >= errors.length ? "success" : "needs_attention";

  const statusConfig = {
    success: { label: "All Clear", color: "text-primary", bg: "bg-primary/10", icon: CheckCircle2 },
    needs_attention: { label: "Issues Found", color: "text-chart-5", bg: "bg-chart-5/10", icon: AlertCircle },
    failed: { label: "Build Failed", color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
  };
  const sc = statusConfig[loopStatus];
  const StatusIcon = sc.icon;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Status Header */}
        <div className="flex items-center gap-4">
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", sc.bg)}>
            <StatusIcon className={cn("w-7 h-7", sc.color)} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">Auto-Fix Loop</h3>
            <Badge className={cn("mt-1 border-0", sc.bg, sc.color)}>{sc.label}</Badge>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>{errors.length} error(s) detected</span>
              <span>·</span>
              <span>{fixedCount} fix(es) applied</span>
            </div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Risk Score</span>
            <span className={cn(
              "font-bold text-sm",
              riskScore <= 20 ? "text-primary" : riskScore <= 50 ? "text-chart-5" : "text-destructive"
            )}>
              {riskScore}/100
            </span>
          </div>
          <Progress value={100 - riskScore} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground">
            {riskScore <= 20 ? "Low risk — production ready" : riskScore <= 50 ? "Medium risk — review recommended" : "High risk — fixes required"}
          </p>
        </div>

        {/* Action Buttons */}
        {loopStatus !== "success" && (
          <div className="flex gap-2">
            {onApplyFixes && (fixes.length > 0 || errorMemory.length > 0) && (
              <Button onClick={onApplyFixes} disabled={isBuilding} className="flex-1 gap-2" variant="default">
                {isBuilding ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Apply All Fixes</>
                )}
              </Button>
            )}
            {onRetryBuild && (
              <Button onClick={onRetryBuild} disabled={isBuilding} className="flex-1 gap-2" variant="outline">
                {isBuilding ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Rebuilding...</>
                ) : (
                  <><RotateCcw className="w-4 h-4" /> Retry Build</>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Errors Found */}
        {errors.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bug className="w-4 h-4 text-destructive" /> Errors Detected ({errors.length})
            </h4>
            {errors.map((error: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-1.5"
              >
                <div className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {error.message || error.description || `Error #${i + 1}`}
                    </p>
                    {error.severity && (
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {error.severity}
                      </Badge>
                    )}
                    {error.module && (
                      <span className="text-[10px] text-muted-foreground ml-2">
                        Module: {error.module}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fixes Applied */}
        {fixes.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" /> Fixes Applied ({fixes.length})
            </h4>
            {fixes.map((fix: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {fix.description || fix.fix || `Fix #${i + 1}`}
                    </p>
                    {fix.file && (
                      <code className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
                        {fix.file}
                      </code>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Fix Memory */}
        {errorMemory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Error Fix Memory ({errorMemory.length})
            </h4>
            <p className="text-[10px] text-muted-foreground">
              Learned patterns from previous builds. These errors will be fixed instantly in future runs.
            </p>
            {errorMemory.map((mem: any, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Pattern:</span>
                  <code className="font-mono text-foreground">{mem.error_signature || mem.pattern || `Pattern #${i + 1}`}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Fix:</span>
                  <span className="text-foreground">{mem.fix_applied || mem.fix || "Auto-corrected"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Issues */}
        {errors.length === 0 && fixes.length === 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm font-medium text-foreground">No issues detected</p>
            <p className="text-xs text-muted-foreground">
              Your build passed all automated checks successfully.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
