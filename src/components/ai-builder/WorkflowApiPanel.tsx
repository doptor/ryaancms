import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitBranch, Globe, Webhook, Zap, ArrowRight,
  Shield, BookOpen, ChevronRight, Copy, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";

interface WorkflowApiPanelProps {
  pipelineState: PipelineState | null;
}

export function WorkflowApiPanel({ pipelineState }: WorkflowApiPanelProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<number | null>(null);

  if (!pipelineState?.config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <GitBranch className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Workflows & APIs</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Build an app to see workflows, API endpoints, webhooks, and edge functions.
          </p>
        </div>
      </div>
    );
  }

  const workflows = pipelineState.workflows || [];
  const businessRules = pipelineState.businessRules || [];
  const apiEndpoints = pipelineState.apiEndpoints || [];
  const webhooks = pipelineState.webhooks || [];
  const edgeFunctions = pipelineState.edgeFunctions || [];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 1500);
    toast({ title: "Copied!", description: "Endpoint copied to clipboard." });
  };

  const methodColors: Record<string, string> = {
    GET: "bg-primary/10 text-primary",
    POST: "bg-chart-5/10 text-chart-5",
    PUT: "bg-chart-3/10 text-chart-3",
    PATCH: "bg-chart-4/10 text-chart-4",
    DELETE: "bg-destructive/10 text-destructive",
  };

  const isEmpty = workflows.length === 0 && businessRules.length === 0 &&
    apiEndpoints.length === 0 && webhooks.length === 0 && edgeFunctions.length === 0;

  if (isEmpty) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <GitBranch className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Workflow Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            The AI pipeline didn't generate workflow or API data for this build. Try a more complex prompt with user flows.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* API Endpoints */}
        {apiEndpoints.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">API Endpoints ({apiEndpoints.length})</h4>
            </div>
            <div className="space-y-1.5">
              {apiEndpoints.map((ep: any, i: number) => {
                const method = ep.method || "GET";
                const path = ep.path || ep.route || ep.endpoint || `/api/${ep.name || "unknown"}`;
                const desc = ep.description || ep.desc || "";
                const auth = ep.auth ?? ep.requires_auth ?? false;
                const id = `ep-${i}`;
                return (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors group">
                    <Badge className={cn("text-[10px] font-mono h-5 px-1.5 shrink-0", methodColors[method] || "bg-muted text-muted-foreground")}>
                      {method}
                    </Badge>
                    <code className="text-xs font-mono text-foreground flex-1 truncate">{path}</code>
                    {auth && <span title="Requires auth"><Shield className="w-3 h-3 text-muted-foreground shrink-0" /></span>}
                    <Button
                      variant="ghost" size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(path, id)}
                    >
                      {copiedEndpoint === id ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Workflows */}
        {workflows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Workflows ({workflows.length})</h4>
            </div>
            <div className="space-y-2">
              {workflows.map((wf: any, i: number) => {
                const name = wf.name || wf.title || `Workflow ${i + 1}`;
                const steps = wf.steps || wf.actions || [];
                const trigger = wf.trigger || wf.event || "manual";
                const isExpanded = expandedWorkflow === i;
                return (
                  <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedWorkflow(isExpanded ? null : i)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <GitBranch className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <p className="text-[10px] text-muted-foreground">Trigger: {trigger} · {steps.length} steps</p>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                    </button>
                    {isExpanded && steps.length > 0 && (
                      <div className="px-3 pb-3 space-y-1.5">
                        {steps.map((step: any, si: number) => (
                          <div key={si} className="flex items-center gap-2 text-xs pl-4">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-primary">{si + 1}</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-foreground">{typeof step === "string" ? step : step.name || step.action || JSON.stringify(step)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Business Rules */}
        {businessRules.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Business Rules ({businessRules.length})</h4>
            </div>
            <div className="space-y-1.5">
              {businessRules.map((rule: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-card text-xs">
                  <div className="w-5 h-5 rounded-full bg-chart-3/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-chart-3">{i + 1}</span>
                  </div>
                  <span className="text-foreground">{typeof rule === "string" ? rule : rule.description || rule.name || JSON.stringify(rule)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Webhooks */}
        {webhooks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Webhooks ({webhooks.length})</h4>
            </div>
            <div className="space-y-1.5">
              {webhooks.map((wh: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card text-xs">
                  <Webhook className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">{typeof wh === "string" ? wh : wh.name || wh.event || `Webhook ${i + 1}`}</p>
                    {wh.url && <p className="text-muted-foreground font-mono truncate">{wh.url}</p>}
                  </div>
                  {wh.method && <Badge variant="secondary" className="text-[10px]">{wh.method}</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edge Functions */}
        {edgeFunctions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Edge Functions ({edgeFunctions.length})</h4>
            </div>
            <div className="space-y-1.5">
              {edgeFunctions.map((ef: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card text-xs">
                  <Zap className="w-3.5 h-3.5 text-chart-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">{typeof ef === "string" ? ef : ef.name || ef.function_name || `Function ${i + 1}`}</p>
                    {ef.description && <p className="text-muted-foreground truncate">{ef.description}</p>}
                  </div>
                  {ef.trigger && <Badge variant="outline" className="text-[10px]">{ef.trigger}</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
