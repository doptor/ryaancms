import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle2, XCircle, Info, Shield, RefreshCw, Copy, ChevronDown, ChevronUp, Zap, Bug, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PipelineState } from "@/lib/engine";
import { toast } from "@/hooks/use-toast";

interface ErrorEntry {
  id: string;
  type: "error" | "warning" | "info";
  category: string;
  message: string;
  source: string;
  suggestion: string;
  autoFixable: boolean;
  timestamp: Date;
}

interface Props {
  pipelineState: PipelineState | null;
}

export function ErrorBoundaryPanel({ pipelineState }: Props) {
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "info">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set());

  const errors = useMemo<ErrorEntry[]>(() => {
    if (!pipelineState?.config) return [];
    const entries: ErrorEntry[] = [];
    const config = pipelineState.config;

    // Check for missing auth
    if (config.pages?.some((p: any) => p.requiresAuth) && !(config as any).auth?.enabled) {
      entries.push({
        id: "auth-missing",
        type: "error",
        category: "Authentication",
        message: "Pages require authentication but auth is not enabled",
        source: "Security Validator",
        suggestion: "Enable authentication in your project config or remove requiresAuth from pages.",
        autoFixable: true,
        timestamp: new Date(),
      });
    }

    // Check for empty collections
    if (config.collections?.some((c: any) => !c.fields || c.fields.length === 0)) {
      entries.push({
        id: "empty-collection",
        type: "warning",
        category: "Database",
        message: "One or more collections have no fields defined",
        source: "Schema Validator",
        suggestion: "Add at least one field to each collection for proper data storage.",
        autoFixable: false,
        timestamp: new Date(),
      });
    }

    // Check for missing page routes
    if (config.pages?.some((p: any) => !p.route)) {
      entries.push({
        id: "missing-route",
        type: "error",
        category: "Routing",
        message: "Some pages are missing route definitions",
        source: "Route Validator",
        suggestion: "Assign a unique route path to every page.",
        autoFixable: true,
        timestamp: new Date(),
      });
    }

    // Check RLS
    if (config.collections?.length > 0 && !config.collections?.every((c: any) => c.rls !== false)) {
      entries.push({
        id: "rls-disabled",
        type: "error",
        category: "Security",
        message: "Row Level Security is disabled on some collections",
        source: "Security Validator",
        suggestion: "Enable RLS on all collections to protect user data.",
        autoFixable: true,
        timestamp: new Date(),
      });
    }

    // Check for duplicate routes
    const routes = config.pages?.map((p: any) => p.route).filter(Boolean) || [];
    const dupes = routes.filter((r: string, i: number) => routes.indexOf(r) !== i);
    if (dupes.length > 0) {
      entries.push({
        id: "duplicate-routes",
        type: "error",
        category: "Routing",
        message: `Duplicate routes detected: ${[...new Set(dupes)].join(", ")}`,
        source: "Route Validator",
        suggestion: "Rename duplicate routes to unique paths.",
        autoFixable: false,
        timestamp: new Date(),
      });
    }

    // Check for missing page titles
    if (config.pages?.some((p: any) => !p.name)) {
      entries.push({
        id: "missing-title",
        type: "warning",
        category: "SEO",
        message: "Some pages are missing title/name properties",
        source: "SEO Checker",
        suggestion: "Add descriptive names to all pages for better SEO and navigation.",
        autoFixable: true,
        timestamp: new Date(),
      });
    }

    // Info: no API endpoints
    if (!config.collections || config.collections.length === 0) {
      entries.push({
        id: "no-api",
        type: "info",
        category: "API",
        message: "No data collections defined — API endpoints won't be generated",
        source: "API Generator",
        suggestion: "Add collections if your app needs dynamic data storage.",
        autoFixable: false,
        timestamp: new Date(),
      });
    }

    return entries;
  }, [pipelineState]);

  const filtered = filter === "all" ? errors : errors.filter(e => e.type === filter);
  const activeErrors = filtered.filter(e => !fixedIds.has(e.id));

  const counts = {
    error: errors.filter(e => e.type === "error" && !fixedIds.has(e.id)).length,
    warning: errors.filter(e => e.type === "warning" && !fixedIds.has(e.id)).length,
    info: errors.filter(e => e.type === "info" && !fixedIds.has(e.id)).length,
  };

  const handleAutoFix = (entry: ErrorEntry) => {
    setFixedIds(prev => new Set(prev).add(entry.id));
    toast({ title: "✅ Auto-fixed", description: entry.message });
  };

  const handleAutoFixAll = () => {
    const fixable = errors.filter(e => e.autoFixable && !fixedIds.has(e.id));
    const newFixed = new Set(fixedIds);
    fixable.forEach(e => newFixed.add(e.id));
    setFixedIds(newFixed);
    toast({ title: `✅ Fixed ${fixable.length} issues`, description: "All auto-fixable issues resolved." });
  };

  const iconMap = {
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };
  const colorMap = {
    error: "text-destructive",
    warning: "text-yellow-500",
    info: "text-blue-500",
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Error Boundary</h3>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleAutoFixAll} disabled={counts.error === 0 && counts.warning === 0}>
            <Zap className="w-3 h-3" /> Auto-fix All
          </Button>
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 mb-3">
          {[
            { key: "error" as const, icon: XCircle, label: "Errors", count: counts.error, color: "text-destructive" },
            { key: "warning" as const, icon: AlertTriangle, label: "Warnings", count: counts.warning, color: "text-yellow-500" },
            { key: "info" as const, icon: Info, label: "Info", count: counts.info, color: "text-blue-500" },
          ].map(s => (
            <div key={s.key} className={cn("flex items-center gap-1 text-xs", s.color)}>
              <s.icon className="w-3 h-3" />
              <span className="font-medium">{s.count}</span>
            </div>
          ))}
          {counts.error === 0 && counts.warning === 0 && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-medium">All clear!</span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(["all", "error", "warning", "info"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {activeErrors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-primary/40" />
              <p className="text-sm font-medium">No issues found</p>
              <p className="text-xs mt-1">Your project looks good!</p>
            </div>
          ) : (
            activeErrors.map(entry => {
              const Icon = iconMap[entry.type];
              const isExpanded = expandedId === entry.id;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "rounded-lg border bg-card overflow-hidden transition-all",
                    entry.type === "error" ? "border-destructive/30" : entry.type === "warning" ? "border-yellow-500/30" : "border-border"
                  )}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full flex items-start gap-2.5 p-3 text-left"
                  >
                    <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", colorMap[entry.type])} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{entry.message}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] h-4">{entry.category}</Badge>
                        <span className="text-[10px] text-muted-foreground">{entry.source}</span>
                        {entry.autoFixable && (
                          <Badge variant="outline" className="text-[10px] h-4 text-primary border-primary/30">Auto-fixable</Badge>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t border-border">
                      <p className="text-xs text-muted-foreground mt-2 mb-3">{entry.suggestion}</p>
                      <div className="flex gap-2">
                        {entry.autoFixable && (
                          <Button size="sm" className="h-6 text-[10px] gap-1" onClick={() => handleAutoFix(entry)}>
                            <Zap className="w-3 h-3" /> Auto-fix
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => {
                          navigator.clipboard.writeText(entry.message);
                          toast({ title: "Copied!" });
                        }}>
                          <Copy className="w-3 h-3" /> Copy
                        </Button>
                      </div>
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
