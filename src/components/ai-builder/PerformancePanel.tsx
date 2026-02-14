import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Zap, CheckCircle2, AlertTriangle, AlertCircle, Info, RefreshCw, Download, FileText, Image, Code, Database, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface Props {
  pipelineState: PipelineState | null;
}

type PerfIssue = {
  severity: "critical" | "warning" | "suggestion" | "pass";
  category: string;
  message: string;
  impact: string;
  fix?: string;
};

type PerfMetric = {
  name: string;
  value: string;
  score: number; // 0-100
  icon: any;
};

export function PerformancePanel({ pipelineState }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const config = pipelineState?.config;

  const audit = useMemo((): { score: number; metrics: PerfMetric[]; issues: PerfIssue[] } => {
    if (!config || !analyzed) return { score: 0, metrics: [], issues: [] };

    const issues: PerfIssue[] = [];
    let score = 100;

    const totalComponents = config.pages.reduce((sum, p) => sum + p.components.length, 0);
    const totalCollections = config.collections.length;
    const totalPages = config.pages.length;

    // Component count per page
    config.pages.forEach((page) => {
      if (page.components.length > 15) {
        issues.push({ severity: "warning", category: "Bundle Size", message: `${page.name}: ${page.components.length} components — consider code splitting`, impact: "Slower initial load", fix: "Split into lazy-loaded sub-routes" });
        score -= 5;
      } else if (page.components.length > 8) {
        issues.push({ severity: "suggestion", category: "Bundle Size", message: `${page.name}: ${page.components.length} components — monitor bundle size`, impact: "May affect load time" });
        score -= 2;
      } else {
        issues.push({ severity: "pass", category: "Bundle Size", message: `${page.name}: ${page.components.length} components — lightweight` , impact: "Good" });
      }
    });

    // Image optimization
    const imageComps = config.pages.flatMap(p => p.components.filter(c => ["media_gallery", "cta_with_image", "hero", "logo_carousel"].includes(c.type)));
    if (imageComps.length > 0) {
      issues.push({ severity: "suggestion", category: "Images", message: `${imageComps.length} image-heavy component(s) — use lazy loading`, impact: "Reduces initial payload", fix: "Add loading='lazy' to <img> tags" });
      score -= 3;
    } else {
      issues.push({ severity: "pass", category: "Images", message: "No heavy image components detected", impact: "Good" });
    }

    // Database query optimization
    const crudTables = config.pages.flatMap(p => p.components.filter(c => c.type === "crud_table"));
    if (crudTables.length > 3) {
      issues.push({ severity: "warning", category: "Database", message: `${crudTables.length} CRUD tables — add pagination to prevent over-fetching`, impact: "Slower data load", fix: "Implement server-side pagination with limit/offset" });
      score -= 5;
    } else if (crudTables.length > 0) {
      issues.push({ severity: "pass", category: "Database", message: `${crudTables.length} CRUD table(s) — manageable`, impact: "Good" });
    }

    // Collection indexing
    config.collections.forEach((col) => {
      const hasRelation = col.fields.some(f => f.type === "relation");
      if (hasRelation) {
        issues.push({ severity: "suggestion", category: "Database", message: `${col.name}: Has relations — ensure foreign key indexes`, impact: "Faster JOIN queries", fix: "Add indexes on foreign key columns" });
        score -= 1;
      }
      if (col.fields.length > 15) {
        issues.push({ severity: "warning", category: "Database", message: `${col.name}: ${col.fields.length} fields — consider normalization`, impact: "Wider rows = slower scans", fix: "Split into related tables" });
        score -= 3;
      }
    });

    // Auth overhead
    const authPages = config.pages.filter(p => p.requires_auth);
    if (authPages.length > 0) {
      issues.push({ severity: "pass", category: "Auth", message: `${authPages.length} protected page(s) — auth checks in place`, impact: "Secure" });
    }

    // Code splitting suggestion
    if (totalPages > 5) {
      issues.push({ severity: "suggestion", category: "Code Splitting", message: `${totalPages} pages — use React.lazy() for route-based splitting`, impact: "Smaller initial bundle", fix: "Wrap page imports with React.lazy()" });
      score -= 3;
    } else {
      issues.push({ severity: "pass", category: "Code Splitting", message: `${totalPages} pages — bundle size is manageable`, impact: "Good" });
    }

    // Caching
    issues.push({ severity: "suggestion", category: "Caching", message: "Add Cache-Control headers for static assets", impact: "Faster repeat visits", fix: "Set max-age=31536000 for hashed assets" });
    score -= 2;

    // Tree shaking
    issues.push({ severity: "pass", category: "Tree Shaking", message: "Vite handles tree-shaking automatically", impact: "Optimal bundle" });

    // Metrics
    const bundleEstimate = totalComponents * 3 + totalPages * 8 + 45; // rough KB estimate
    const fcp = totalComponents > 20 ? 2.8 : totalComponents > 10 ? 1.8 : 1.2;
    const lcp = totalComponents > 20 ? 3.5 : totalComponents > 10 ? 2.5 : 1.5;
    const tbt = totalComponents > 15 ? 350 : totalComponents > 8 ? 180 : 50;

    const metrics: PerfMetric[] = [
      { name: "Est. Bundle Size", value: `~${bundleEstimate} KB`, score: bundleEstimate < 200 ? 95 : bundleEstimate < 400 ? 70 : 40, icon: FileText },
      { name: "Est. FCP", value: `~${fcp}s`, score: fcp < 1.8 ? 95 : fcp < 2.5 ? 70 : 40, icon: Zap },
      { name: "Est. LCP", value: `~${lcp}s`, score: lcp < 2.5 ? 95 : lcp < 3.5 ? 70 : 40, icon: Image },
      { name: "Est. TBT", value: `~${tbt}ms`, score: tbt < 200 ? 95 : tbt < 400 ? 70 : 40, icon: Code },
      { name: "DB Collections", value: `${totalCollections}`, score: totalCollections < 10 ? 95 : totalCollections < 20 ? 70 : 50, icon: Database },
      { name: "Total Components", value: `${totalComponents}`, score: totalComponents < 30 ? 95 : totalComponents < 60 ? 70 : 40, icon: Layers },
    ];

    return { score: Math.max(0, Math.min(100, score)), metrics, issues };
  }, [config, analyzed]);

  const runAudit = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalyzed(true);
      setIsAnalyzing(false);
      toast({ title: "⚡ Performance audit complete!", description: `Score: ${audit.score || "—"}/100` });
    }, 1200);
  };

  const handleExport = () => {
    const report = [
      `# Performance Audit — ${config?.title || "Project"}`,
      `Score: ${audit.score}/100`,
      "",
      "## Metrics",
      ...audit.metrics.map(m => `- ${m.name}: ${m.value} (${m.score}/100)`),
      "",
      "## Issues",
      ...audit.issues.map(i => `[${i.severity.toUpperCase()}] ${i.category}: ${i.message} — Impact: ${i.impact}${i.fix ? ` → Fix: ${i.fix}` : ""}`),
    ].join("\n");
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "performance-audit.md";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Performance report downloaded." });
  };

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Performance Optimizer</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to analyze performance.</p>
        </div>
      </div>
    );
  }

  const issueIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
      case "warning": return <AlertTriangle className="w-3.5 h-3.5 text-chart-5 shrink-0" />;
      case "pass": return <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />;
      default: return <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Performance Optimizer</h3>
              <p className="text-[11px] text-muted-foreground">{config.pages.length} pages · {config.collections.length} collections</p>
            </div>
          </div>
          {analyzed && (
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-1 text-xs">
              <Download className="w-3 h-3" /> Report
            </Button>
          )}
        </div>

        {analyzed && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Performance Score</span>
              <span className={cn(
                "text-sm font-bold",
                audit.score >= 80 ? "text-primary" : audit.score >= 50 ? "text-chart-5" : "text-destructive"
              )}>
                {audit.score}/100
              </span>
            </div>
            <Progress value={audit.score} className="h-2" />
          </div>
        )}

        <Button size="sm" onClick={runAudit} disabled={isAnalyzing} className="w-full gap-1.5">
          {isAnalyzing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : analyzed ? <><RefreshCw className="w-3.5 h-3.5" /> Re-analyze</> : <><Zap className="w-3.5 h-3.5" /> Run Performance Audit</>}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {analyzed ? (
          <div className="p-4 space-y-4">
            {/* Metrics grid */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Estimated Metrics</p>
              <div className="grid grid-cols-2 gap-2">
                {audit.metrics.map((m) => (
                  <div key={m.name} className="rounded-lg border border-border p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <m.icon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{m.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{m.value}</span>
                      <Badge variant={m.score >= 80 ? "secondary" : "outline"} className={cn(
                        "text-[10px] h-4",
                        m.score >= 80 ? "text-primary" : m.score >= 50 ? "text-chart-5" : "text-destructive"
                      )}>
                        {m.score >= 80 ? "Good" : m.score >= 50 ? "Needs Work" : "Poor"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            {["critical", "warning", "suggestion", "pass"].map((sev) => {
              const filtered = audit.issues.filter(i => i.severity === sev);
              if (filtered.length === 0) return null;
              return (
                <div key={sev} className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {sev === "pass" ? "Passed" : sev === "critical" ? "Critical" : sev === "warning" ? "Warnings" : "Suggestions"}
                  </p>
                  {filtered.map((issue, i) => (
                    <div key={i} className={cn(
                      "flex items-start gap-2 p-2.5 rounded-lg border text-xs",
                      issue.severity === "critical" ? "bg-destructive/5 border-destructive/20" :
                      issue.severity === "warning" ? "bg-chart-5/5 border-chart-5/20" :
                      issue.severity === "pass" ? "bg-primary/5 border-primary/20" :
                      "bg-muted/50 border-border"
                    )}>
                      {issueIcon(issue.severity)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[9px] h-4">{issue.category}</Badge>
                          <span className="text-[10px] text-muted-foreground">Impact: {issue.impact}</span>
                        </div>
                        <p className="text-foreground mt-0.5">{issue.message}</p>
                        {issue.fix && <p className="text-primary mt-0.5 text-[11px]">💡 {issue.fix}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Click "Run Performance Audit" to analyze your app.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
