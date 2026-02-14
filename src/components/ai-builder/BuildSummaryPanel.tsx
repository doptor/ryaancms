import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Shield, Palette, CheckCircle2, Download,
  Users, TestTube2, BookOpen, Layers, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";
import JSZip from "jszip";

interface BuildSummaryPanelProps {
  pipelineState: PipelineState | null;
}

export function BuildSummaryPanel({ pipelineState }: BuildSummaryPanelProps) {
  if (!pipelineState?.config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Layers className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Build Summary</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Build something to see RBAC, tests, docs, and theme summary.
          </p>
        </div>
      </div>
    );
  }

  const { rbac, testSuite, docs, theme, config } = pipelineState;

  const handleDownloadDocs = async () => {
    if (!docs) return;
    const zip = new JSZip();
    zip.file("README.md", docs.readme);
    zip.file("INSTALL.md", docs.install);
    zip.file("API.md", docs.api);
    zip.file("DB_SCHEMA.md", docs.db_schema);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.title || "project"}-docs.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "📄 Docs Downloaded!", description: "4 documentation files exported." });
  };

  const docChecklist = docs?.checklist || {};

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* RBAC Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> RBAC System
          </h4>
          {rbac ? (
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {rbac.roles.map((role) => (
                  <Badge key={role.name} variant="secondary" className="gap-1 text-xs">
                    <Shield className="w-3 h-3" /> {role.name}
                  </Badge>
                ))}
              </div>
              <div className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Roles</span>
                  <span className="font-semibold text-foreground">{rbac.roles.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Permissions</span>
                  <span className="font-semibold text-foreground">{rbac.permissions.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">RLS Policies</span>
                  <span className="font-semibold text-foreground">{rbac.policies.length}</span>
                </div>
              </div>
              {rbac.permissions.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {rbac.permissions.slice(0, 12).map((p) => (
                    <Badge key={p.key} variant="outline" className="text-[10px]">{p.key}</Badge>
                  ))}
                  {rbac.permissions.length > 12 && (
                    <Badge variant="outline" className="text-[10px]">+{rbac.permissions.length - 12} more</Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No RBAC data generated.</p>
          )}
        </div>

        <Separator />

        {/* Test Suite Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TestTube2 className="w-4 h-4 text-primary" /> Test Suite
          </h4>
          {testSuite ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Estimated Coverage</span>
                  <span className={cn(
                    "text-sm font-bold",
                    testSuite.coverage_summary.estimated_coverage >= 70 ? "text-primary" : "text-chart-5"
                  )}>
                    {testSuite.coverage_summary.estimated_coverage}%
                  </span>
                </div>
                <Progress value={testSuite.coverage_summary.estimated_coverage} className="h-1.5" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Scenarios</span>
                    <span className="font-semibold text-foreground">{testSuite.coverage_summary.total_scenarios}</span>
                  </div>
                  {Object.entries(testSuite.coverage_summary.by_category).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-muted-foreground capitalize">{cat}</span>
                      <span className="font-semibold text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No test suite generated.</p>
          )}
        </div>

        <Separator />

        {/* Documentation Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Documentation
            </h4>
            {docs && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={handleDownloadDocs}>
                <Download className="w-3 h-3" /> Download Docs
              </Button>
            )}
          </div>
          {docs ? (
            <div className="space-y-1">
              {Object.entries(docChecklist).map(([file, generated]) => (
                <div key={file} className="flex items-center gap-2 text-xs">
                  {generated ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground/30" />
                  )}
                  <span className={cn(generated ? "text-foreground" : "text-muted-foreground")}>{file}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No documentation generated.</p>
          )}
        </div>

        <Separator />

        {/* Theme Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" /> Theme & Branding
          </h4>
          {theme ? (
            <div className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Preset</span>
                <Badge variant="secondary">{theme.preset_name}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Primary</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: theme.tokens.primary_color }}
                  />
                  <span className="font-mono text-foreground">{theme.tokens.primary_color}</span>
                </div>
              </div>
              {theme.tokens.accent_color && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Accent</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: theme.tokens.accent_color }}
                    />
                    <span className="font-mono text-foreground">{theme.tokens.accent_color}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Font</span>
                <span className="text-foreground">{theme.tokens.font}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Border Radius</span>
                <span className="text-foreground">{theme.tokens.border_radius}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Mode</span>
                <Badge variant="outline" className="text-[10px]">{theme.tokens.theme_mode}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No theme selected. Choose a theme preset before building.</p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
