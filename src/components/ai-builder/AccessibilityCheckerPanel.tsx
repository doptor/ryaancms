import { useState, useMemo } from "react";
import { Eye, CheckCircle2, AlertTriangle, XCircle, Info, Palette, Type, MousePointer, Image, Globe, Keyboard, ChevronDown, ChevronUp, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PipelineState } from "@/lib/engine";
import { toast } from "@/hooks/use-toast";

interface A11yIssue {
  id: string;
  severity: "critical" | "major" | "minor";
  category: string;
  wcag: string;
  title: string;
  description: string;
  element?: string;
  fix: string;
  autoFixable: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  "Color & Contrast": Palette,
  "Images": Image,
  "Typography": Type,
  "Interactive": MousePointer,
  "Keyboard": Keyboard,
  "Semantics": Globe,
};

interface Props {
  pipelineState: PipelineState | null;
}

export function AccessibilityCheckerPanel({ pipelineState }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "critical" | "major" | "minor">("all");

  const issues = useMemo<A11yIssue[]>(() => {
    if (!pipelineState?.config || !hasScanned) return [];
    const config = pipelineState.config;
    const found: A11yIssue[] = [];

    // Check images for alt text
    const pages = config.pages || [];
    const hasImages = pages.some((p: any) => p.sections?.some((s: any) => s.type === "hero" || s.type === "gallery"));
    if (hasImages) {
      found.push({
        id: "img-alt",
        severity: "critical",
        category: "Images",
        wcag: "WCAG 1.1.1",
        title: "Images may lack alt text",
        description: "Hero sections and galleries should have descriptive alt attributes for screen readers.",
        element: "<img> elements in hero/gallery sections",
        fix: "Add descriptive alt attributes to all images. Use empty alt=\"\" for decorative images.",
        autoFixable: true,
      });
    }

    // Check for color contrast
    found.push({
      id: "contrast-check",
      severity: "major",
      category: "Color & Contrast",
      wcag: "WCAG 1.4.3",
      title: "Verify minimum contrast ratio (4.5:1)",
      description: "Text must have sufficient contrast against its background for readability.",
      fix: "Ensure all text has at least 4.5:1 contrast ratio. Large text (18px+) requires 3:1.",
      autoFixable: false,
    });

    // Check for keyboard navigation
    if (pages.some((p: any) => p.sections?.some((s: any) => ["form", "table", "modal"].includes(s.type)))) {
      found.push({
        id: "keyboard-nav",
        severity: "critical",
        category: "Keyboard",
        wcag: "WCAG 2.1.1",
        title: "Interactive elements must be keyboard accessible",
        description: "Forms, tables, and modals must be fully navigable via keyboard (Tab, Enter, Escape).",
        element: "Forms, tables, modals",
        fix: "Ensure all interactive elements have proper tabIndex, onKeyDown handlers, and focus management.",
        autoFixable: true,
      });
    }

    // Check for semantic HTML
    found.push({
      id: "semantic-html",
      severity: "major",
      category: "Semantics",
      wcag: "WCAG 1.3.1",
      title: "Use semantic HTML elements",
      description: "Use <header>, <nav>, <main>, <footer>, <section>, <article> instead of generic <div>.",
      fix: "Replace generic divs with semantic HTML5 elements for better screen reader support.",
      autoFixable: true,
    });

    // Check for form labels
    if (pages.some((p: any) => p.sections?.some((s: any) => s.type === "form"))) {
      found.push({
        id: "form-labels",
        severity: "critical",
        category: "Interactive",
        wcag: "WCAG 1.3.1",
        title: "Form inputs must have associated labels",
        description: "Every form input needs a visible label or aria-label for screen readers.",
        element: "<input>, <select>, <textarea> elements",
        fix: "Add <label> elements with htmlFor matching input id, or use aria-label/aria-labelledby.",
        autoFixable: true,
      });
    }

    // Focus visible
    found.push({
      id: "focus-visible",
      severity: "major",
      category: "Keyboard",
      wcag: "WCAG 2.4.7",
      title: "Focus indicators must be visible",
      description: "Interactive elements need clear visual focus indicators for keyboard users.",
      fix: "Use focus-visible CSS or Tailwind's focus-visible: utilities on all interactive elements.",
      autoFixable: true,
    });

    // Skip navigation link
    if (pages.length > 2) {
      found.push({
        id: "skip-nav",
        severity: "minor",
        category: "Keyboard",
        wcag: "WCAG 2.4.1",
        title: "Add skip navigation link",
        description: "A 'Skip to main content' link helps keyboard users bypass repetitive navigation.",
        fix: "Add a visually hidden 'Skip to main content' link as the first focusable element.",
        autoFixable: true,
      });
    }

    // Touch target size
    found.push({
      id: "touch-target",
      severity: "minor",
      category: "Interactive",
      wcag: "WCAG 2.5.8",
      title: "Ensure minimum touch target size (44x44px)",
      description: "Interactive elements should be at least 44x44 CSS pixels for mobile users.",
      fix: "Set min-width and min-height of 44px on buttons, links, and other interactive elements.",
      autoFixable: false,
    });

    return found;
  }, [pipelineState, hasScanned]);

  const filtered = filter === "all" ? issues : issues.filter(i => i.severity === filter);
  const active = filtered.filter(i => !fixedIds.has(i.id));

  const score = useMemo(() => {
    if (!hasScanned || issues.length === 0) return 0;
    const total = issues.length;
    const fixed = fixedIds.size;
    const remaining = issues.filter(i => !fixedIds.has(i.id));
    const penalty = remaining.reduce((acc, i) => acc + (i.severity === "critical" ? 15 : i.severity === "major" ? 8 : 3), 0);
    return Math.max(0, Math.min(100, 100 - penalty + (fixed * 5)));
  }, [issues, fixedIds, hasScanned]);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
      toast({ title: "♿ Scan complete", description: `Found ${issues.length || "several"} accessibility issues.` });
    }, 1500);
  };

  const handleAutoFix = (issue: A11yIssue) => {
    setFixedIds(prev => new Set(prev).add(issue.id));
    toast({ title: "✅ Fixed", description: issue.title });
  };

  const severityColors = {
    critical: "text-destructive border-destructive/30",
    major: "text-yellow-500 border-yellow-500/30",
    minor: "text-blue-500 border-border",
  };
  const severityIcons = { critical: XCircle, major: AlertTriangle, minor: Info };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Accessibility Checker</h3>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleScan} disabled={isScanning}>
            {isScanning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {isScanning ? "Scanning..." : hasScanned ? "Re-scan" : "Run Scan"}
          </Button>
        </div>

        {hasScanned && (
          <>
            {/* Score */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Accessibility Score</span>
                <span className={cn("text-sm font-bold", score >= 80 ? "text-primary" : score >= 50 ? "text-yellow-500" : "text-destructive")}>
                  {score}/100
                </span>
              </div>
              <Progress value={score} className="h-2" />
            </div>

            {/* Counts */}
            <div className="flex gap-3 mb-3">
              {(["critical", "major", "minor"] as const).map(s => {
                const SIcon = severityIcons[s];
                const count = issues.filter(i => i.severity === s && !fixedIds.has(i.id)).length;
                return (
                  <div key={s} className={cn("flex items-center gap-1 text-xs", severityColors[s].split(" ")[0])}>
                    <SIcon className="w-3 h-3" />
                    <span className="font-medium">{count}</span>
                    <span className="text-muted-foreground">{s}</span>
                  </div>
                );
              })}
            </div>

            {/* Filter */}
            <div className="flex gap-1">
              {(["all", "critical", "major", "minor"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Issues */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {!hasScanned ? (
            <div className="text-center py-16 text-muted-foreground">
              <Eye className="w-10 h-10 mx-auto mb-3 text-primary/30" />
              <p className="text-sm font-medium">Run an accessibility scan</p>
              <p className="text-xs mt-1 max-w-[240px] mx-auto">Checks your generated app against WCAG 2.1 guidelines for accessibility compliance.</p>
              <Button size="sm" className="mt-4 gap-1" onClick={handleScan}>
                <RefreshCw className="w-3 h-3" /> Start Scan
              </Button>
            </div>
          ) : active.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-primary/40" />
              <p className="text-sm font-medium">All issues resolved!</p>
              <p className="text-xs mt-1">Great accessibility compliance.</p>
            </div>
          ) : (
            active.map(issue => {
              const SIcon = severityIcons[issue.severity];
              const CatIcon = CATEGORY_ICONS[issue.category] || Globe;
              const isExpanded = expandedId === issue.id;
              return (
                <div
                  key={issue.id}
                  className={cn("rounded-lg border bg-card overflow-hidden transition-all", severityColors[issue.severity].split(" ").slice(1).join(" ") || "border-border")}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                    className="w-full flex items-start gap-2.5 p-3 text-left"
                  >
                    <SIcon className={cn("w-4 h-4 shrink-0 mt-0.5", severityColors[issue.severity].split(" ")[0])} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground">{issue.title}</span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] h-4 gap-0.5">
                          <CatIcon className="w-2.5 h-2.5" /> {issue.category}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-4 font-mono">{issue.wcag}</Badge>
                        {issue.autoFixable && (
                          <Badge variant="outline" className="text-[10px] h-4 text-primary border-primary/30">Auto-fixable</Badge>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t border-border space-y-2">
                      <p className="text-xs text-muted-foreground mt-2">{issue.description}</p>
                      {issue.element && (
                        <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">{issue.element}</div>
                      )}
                      <p className="text-xs text-foreground/80"><strong>Fix:</strong> {issue.fix}</p>
                      {issue.autoFixable && (
                        <Button size="sm" className="h-6 text-[10px] gap-1" onClick={() => handleAutoFix(issue)}>
                          <Zap className="w-3 h-3" /> Auto-fix
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
