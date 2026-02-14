import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderTree, Layers, Settings, Puzzle, Database,
  CheckCircle2, Circle, Copy, ChevronRight, ChevronDown,
  Package, Cpu, FileCode2, Blocks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";

interface InstallerArchitecturePanelProps {
  pipelineState: PipelineState | null;
}

function FolderTreeView({ structure, depth = 0 }: { structure: Record<string, any>; depth?: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(Object.keys(structure)));

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className={cn(depth > 0 && "ml-4 border-l border-border pl-2")}>
      {Object.entries(structure).map(([key, value]) => {
        const isFolder = typeof value === "object" && value !== null && !Array.isArray(value);
        const isOpen = expanded.has(key);
        return (
          <div key={key}>
            {isFolder ? (
              <>
                <button
                  onClick={() => toggle(key)}
                  className="flex items-center gap-1.5 py-1 text-xs hover:text-foreground transition-colors w-full text-left"
                >
                  {isOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                  <FolderTree className="w-3.5 h-3.5 text-chart-5" />
                  <span className="font-medium text-foreground">{key}/</span>
                </button>
                {isOpen && <FolderTreeView structure={value} depth={depth + 1} />}
              </>
            ) : (
              <div className="flex items-center gap-1.5 py-1 pl-5 text-xs">
                <FileCode2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{key}</span>
                {typeof value === "string" && value && (
                  <span className="text-[10px] text-muted-foreground/60 ml-1">— {value}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function InstallerArchitecturePanel({ pipelineState }: InstallerArchitecturePanelProps) {
  const [copiedPrisma, setCopiedPrisma] = useState(false);

  if (!pipelineState?.config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Installer & Architecture</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Build an app to see installer steps, folder structure, middleware, and reusable components.
          </p>
        </div>
      </div>
    );
  }

  const installerSteps = pipelineState.installerSteps || [];
  const folderStructure = pipelineState.folderStructure || {};
  const middlewareStack = pipelineState.middlewareStack || [];
  const reusableComponents = pipelineState.reusableComponents || [];
  const seedData = pipelineState.seedData || [];
  const pluginHooks = pipelineState.pluginHooks || [];
  const prismaHint = pipelineState.prismaSchemaHint || "";
  const testScenarios = pipelineState.testScenarios || [];
  const permissionMatrix = pipelineState.permissionMatrix || [];

  const handleCopyPrisma = () => {
    navigator.clipboard.writeText(prismaHint);
    setCopiedPrisma(true);
    setTimeout(() => setCopiedPrisma(false), 1500);
    toast({ title: "Copied!", description: "Prisma schema copied to clipboard." });
  };

  const isEmpty = installerSteps.length === 0 && Object.keys(folderStructure).length === 0 &&
    middlewareStack.length === 0 && reusableComponents.length === 0 && seedData.length === 0 &&
    pluginHooks.length === 0 && !prismaHint && testScenarios.length === 0 && permissionMatrix.length === 0;

  if (isEmpty) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Architecture Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            The AI pipeline didn't generate architecture data for this build. Try a more complex enterprise prompt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Installer Steps */}
        {installerSteps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Installer Steps ({installerSteps.length})</h4>
            </div>
            <div className="space-y-1.5">
              {installerSteps.map((step: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="text-xs text-foreground flex-1">{typeof step === "string" ? step : step.name || step.description || JSON.stringify(step)}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folder Structure */}
        {Object.keys(folderStructure).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Project Structure</h4>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <FolderTreeView structure={folderStructure} />
            </div>
          </div>
        )}

        {/* Middleware Stack */}
        {middlewareStack.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Middleware Stack ({middlewareStack.length})</h4>
            </div>
            <div className="space-y-1">
              {middlewareStack.map((mw: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card text-xs">
                  <div className="w-5 h-5 rounded bg-chart-4/10 flex items-center justify-center shrink-0">
                    <Cpu className="w-3 h-3 text-chart-4" />
                  </div>
                  <span className="text-foreground font-mono">{typeof mw === "string" ? mw : mw.name || JSON.stringify(mw)}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">Layer {i + 1}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reusable Components */}
        {reusableComponents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Blocks className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Reusable Components ({reusableComponents.length})</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {reusableComponents.map((comp: any, i: number) => (
                <Badge key={i} variant="outline" className="text-xs gap-1">
                  <Blocks className="w-3 h-3" />
                  {typeof comp === "string" ? comp : comp.name || JSON.stringify(comp)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Plugin Hooks */}
        {pluginHooks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Plugin Hooks ({pluginHooks.length})</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pluginHooks.map((hook: any, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs font-mono">
                  {typeof hook === "string" ? hook : hook.name || JSON.stringify(hook)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Seed Data */}
        {seedData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Seed Data ({seedData.length})</h4>
            </div>
            <div className="space-y-1.5">
              {seedData.map((sd: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg border border-border bg-card text-xs">
                  <Database className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-foreground">{typeof sd === "string" ? sd : sd.table ? `${sd.table}: ${sd.count || ""} records` : JSON.stringify(sd)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Scenarios */}
        {testScenarios.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Test Scenarios ({testScenarios.length})</h4>
            </div>
            <div className="space-y-1">
              {testScenarios.map((ts: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card text-xs">
                  <Circle className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-foreground">{typeof ts === "string" ? ts : ts.name || ts.description || JSON.stringify(ts)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permission Matrix */}
        {permissionMatrix.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Permission Matrix</h4>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-foreground">Role / Resource</th>
                      {permissionMatrix[0] && typeof permissionMatrix[0] === "object" && 
                        Object.keys(permissionMatrix[0]).filter(k => k !== "role" && k !== "name").map(k => (
                          <th key={k} className="text-center px-2 py-2 font-medium text-foreground">{k}</th>
                        ))
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {permissionMatrix.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium text-foreground">{row.role || row.name || `Row ${i + 1}`}</td>
                        {Object.entries(row).filter(([k]) => k !== "role" && k !== "name").map(([k, v]) => (
                          <td key={k} className="text-center px-2 py-2">
                            {v === true ? <CheckCircle2 className="w-3.5 h-3.5 text-primary mx-auto" /> :
                             v === false ? <Circle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" /> :
                             <span className="text-muted-foreground">{String(v)}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Prisma Schema Hint */}
        {prismaHint && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Prisma Schema</h4>
              </div>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopyPrisma}>
                {copiedPrisma ? <><CheckCircle2 className="w-3 h-3 text-primary" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </Button>
            </div>
            <pre className="rounded-xl border border-border bg-muted/30 p-3 text-xs font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
              {prismaHint}
            </pre>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
