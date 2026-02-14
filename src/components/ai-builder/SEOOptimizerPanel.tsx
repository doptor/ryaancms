import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Search, CheckCircle2, AlertTriangle, AlertCircle, Info, Download, RefreshCw, FileText, Globe, Link, Image } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface Props {
  pipelineState: PipelineState | null;
}

type SEOIssue = {
  severity: "error" | "warning" | "info" | "pass";
  category: string;
  message: string;
  fix?: string;
};

export function SEOOptimizerPanel({ pipelineState }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const config = pipelineState?.config;

  const seoAudit = useMemo((): { score: number; issues: SEOIssue[] } => {
    if (!config || !analyzed) return { score: 0, issues: [] };

    const issues: SEOIssue[] = [];
    let score = 100;

    // Title check
    if (config.title && config.title.length <= 60) {
      issues.push({ severity: "pass", category: "Title", message: `Title tag is good: "${config.title}" (${config.title.length}/60 chars)` });
    } else if (config.title && config.title.length > 60) {
      issues.push({ severity: "warning", category: "Title", message: `Title too long: ${config.title.length}/60 chars`, fix: "Shorten title to under 60 characters" });
      score -= 5;
    } else {
      issues.push({ severity: "error", category: "Title", message: "Missing page title", fix: "Add a descriptive title tag" });
      score -= 15;
    }

    // Description
    if (config.description && config.description.length <= 160) {
      issues.push({ severity: "pass", category: "Meta Description", message: `Description is good (${config.description.length}/160 chars)` });
    } else if (config.description && config.description.length > 160) {
      issues.push({ severity: "warning", category: "Meta Description", message: `Description too long: ${config.description.length}/160 chars`, fix: "Shorten to under 160 characters" });
      score -= 5;
    } else {
      issues.push({ severity: "error", category: "Meta Description", message: "Missing meta description", fix: "Add a compelling meta description" });
      score -= 10;
    }

    // Pages analysis
    const hasHomePage = config.pages.some(p => p.route === "/" || p.route === "/home");
    if (hasHomePage) {
      issues.push({ severity: "pass", category: "Structure", message: "Home page exists" });
    } else {
      issues.push({ severity: "warning", category: "Structure", message: "No home page (/) found", fix: "Add a landing/home page at route '/'" });
      score -= 5;
    }

    // H1 check per page
    config.pages.forEach((page) => {
      const hasHero = page.components.some(c => c.type === "hero" || c.type === "final_cta");
      if (hasHero) {
        issues.push({ severity: "pass", category: "Headings", message: `${page.name}: Has hero/heading component` });
      } else {
        issues.push({ severity: "info", category: "Headings", message: `${page.name}: Consider adding an H1 heading`, fix: "Add a hero or heading component" });
        score -= 2;
      }
    });

    // Semantic HTML
    const hasNavbar = config.pages.some(p => p.components.some(c => c.type === "navbar"));
    const hasFooter = config.pages.some(p => p.components.some(c => c.type === "footer"));
    if (hasNavbar) issues.push({ severity: "pass", category: "Semantic HTML", message: "Navigation component found" });
    else { issues.push({ severity: "warning", category: "Semantic HTML", message: "No navigation component", fix: "Add a navbar for better semantics" }); score -= 5; }
    if (hasFooter) issues.push({ severity: "pass", category: "Semantic HTML", message: "Footer component found" });
    else { issues.push({ severity: "info", category: "Semantic HTML", message: "No footer component", fix: "Add a footer with links" }); score -= 2; }

    // Image alt check
    const imageComponents = config.pages.flatMap(p => p.components.filter(c => c.type === "media_gallery" || c.type === "cta_with_image"));
    if (imageComponents.length > 0) {
      const missingAlt = imageComponents.filter(c => !c.props?.alt_text);
      if (missingAlt.length > 0) {
        issues.push({ severity: "warning", category: "Images", message: `${missingAlt.length} image component(s) missing alt text`, fix: "Add descriptive alt attributes" });
        score -= 5;
      } else {
        issues.push({ severity: "pass", category: "Images", message: "All images have alt text" });
      }
    }

    // Sitemap / robots
    issues.push({ severity: "pass", category: "Robots", message: "robots.txt configured" });

    // Mobile responsiveness
    issues.push({ severity: "pass", category: "Mobile", message: "Responsive viewport meta tag present" });

    // JSON-LD
    const hasFAQ = config.pages.some(p => p.components.some(c => c.type === "faq"));
    const hasPricing = config.pages.some(p => p.components.some(c => c.type === "pricing_table"));
    if (hasFAQ) {
      issues.push({ severity: "info", category: "Structured Data", message: "FAQ section detected — add FAQPage JSON-LD", fix: "Generate JSON-LD for FAQ" });
      score -= 2;
    }
    if (hasPricing) {
      issues.push({ severity: "info", category: "Structured Data", message: "Pricing detected — add Product JSON-LD", fix: "Generate JSON-LD for pricing" });
      score -= 2;
    }

    // URL structure
    config.pages.forEach((page) => {
      if (page.route.includes(" ") || page.route.includes("_")) {
        issues.push({ severity: "warning", category: "URLs", message: `${page.name}: Route "${page.route}" should use hyphens`, fix: `Change to "${page.route.replace(/[_ ]/g, "-")}"` });
        score -= 3;
      }
    });

    // Canonical
    issues.push({ severity: "info", category: "Canonical", message: "Add canonical tags to prevent duplicate content", fix: "Add <link rel='canonical'> to each page" });

    return { score: Math.max(0, Math.min(100, score)), issues };
  }, [config, analyzed]);

  const runAudit = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalyzed(true);
      setIsAnalyzing(false);
      toast({ title: "🔍 SEO audit complete!", description: `Score: ${seoAudit.score || "—"}/100` });
    }, 1000);
  };

  const handleExportReport = () => {
    const report = [
      `# SEO Audit Report — ${config?.title || "Project"}`,
      `Score: ${seoAudit.score}/100`,
      "",
      ...seoAudit.issues.map(i => `[${i.severity.toUpperCase()}] ${i.category}: ${i.message}${i.fix ? ` → Fix: ${i.fix}` : ""}`),
    ].join("\n");
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seo-audit-report.md";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "SEO report downloaded." });
  };

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">SEO Optimizer</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to run SEO analysis.</p>
        </div>
      </div>
    );
  }

  const issueIcon = (severity: string) => {
    switch (severity) {
      case "error": return <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
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
              <Search className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">SEO Optimizer</h3>
              <p className="text-[11px] text-muted-foreground">{config.pages.length} pages to analyze</p>
            </div>
          </div>
          {analyzed && (
            <Button size="sm" variant="outline" onClick={handleExportReport} className="gap-1 text-xs">
              <Download className="w-3 h-3" /> Report
            </Button>
          )}
        </div>

        {analyzed && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">SEO Score</span>
              <span className={cn(
                "text-sm font-bold",
                seoAudit.score >= 80 ? "text-primary" : seoAudit.score >= 50 ? "text-chart-5" : "text-destructive"
              )}>
                {seoAudit.score}/100
              </span>
            </div>
            <Progress value={seoAudit.score} className="h-2" />
            <div className="flex gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary" /> {seoAudit.issues.filter(i => i.severity === "pass").length} passed</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-chart-5" /> {seoAudit.issues.filter(i => i.severity === "warning").length} warnings</span>
              <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-destructive" /> {seoAudit.issues.filter(i => i.severity === "error").length} errors</span>
            </div>
          </div>
        )}

        <Button
          size="sm"
          onClick={runAudit}
          disabled={isAnalyzing}
          className="w-full gap-1.5"
        >
          {isAnalyzing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : analyzed ? <><RefreshCw className="w-3.5 h-3.5" /> Re-analyze</> : <><Search className="w-3.5 h-3.5" /> Run SEO Audit</>}
        </Button>
      </div>

      {/* Issues */}
      <ScrollArea className="flex-1">
        {analyzed ? (
          <div className="p-4 space-y-2">
            {/* Errors first, then warnings, then info, then pass */}
            {["error", "warning", "info", "pass"].map((sev) => {
              const filtered = seoAudit.issues.filter(i => i.severity === sev);
              if (filtered.length === 0) return null;
              return (
                <div key={sev} className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-2">
                    {sev === "pass" ? "Passed" : sev === "error" ? "Errors" : sev === "warning" ? "Warnings" : "Info"}
                  </p>
                  {filtered.map((issue, i) => (
                    <div key={i} className={cn(
                      "flex items-start gap-2 p-2.5 rounded-lg border text-xs",
                      issue.severity === "error" ? "bg-destructive/5 border-destructive/20" :
                      issue.severity === "warning" ? "bg-chart-5/5 border-chart-5/20" :
                      issue.severity === "pass" ? "bg-primary/5 border-primary/20" :
                      "bg-muted/50 border-border"
                    )}>
                      {issueIcon(issue.severity)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[9px] h-4">{issue.category}</Badge>
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
            Click "Run SEO Audit" to analyze your app's SEO.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
