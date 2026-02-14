import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Globe, Server, Database, Shield, Copy,
  CheckCircle2, Plus, Trash2, Settings, Cloud,
  Lock, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine/orchestrator";

interface EnvironmentManagerPanelProps {
  pipelineState: PipelineState | null;
}

type EnvType = "development" | "staging" | "production";

interface EnvVariable {
  key: string;
  value: string;
  secret: boolean;
}

interface Environment {
  type: EnvType;
  label: string;
  icon: any;
  color: string;
  variables: EnvVariable[];
  url: string;
  status: "active" | "inactive" | "deploying";
}

export function EnvironmentManagerPanel({ pipelineState }: EnvironmentManagerPanelProps) {
  const [activeEnv, setActiveEnv] = useState<EnvType>("development");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newSecret, setNewSecret] = useState(false);

  const config = pipelineState?.config;
  const projectName = config?.title?.toLowerCase().replace(/\s+/g, "-") || "app";

  const [environments, setEnvironments] = useState<Environment[]>([
    {
      type: "development",
      label: "Development",
      icon: Settings,
      color: "text-chart-2",
      url: `http://localhost:3000`,
      status: "active",
      variables: [
        { key: "NODE_ENV", value: "development", secret: false },
        { key: "PORT", value: "3000", secret: false },
        { key: "DATABASE_URL", value: `mysql://root:password@localhost:3306/${projectName}_dev`, secret: true },
        { key: "JWT_SECRET", value: "dev-secret-change-me", secret: true },
        { key: "CORS_ORIGIN", value: "http://localhost:5173", secret: false },
      ],
    },
    {
      type: "staging",
      label: "Staging",
      icon: Cloud,
      color: "text-chart-5",
      url: `https://staging.${projectName}.com`,
      status: "inactive",
      variables: [
        { key: "NODE_ENV", value: "staging", secret: false },
        { key: "PORT", value: "3000", secret: false },
        { key: "DATABASE_URL", value: `mysql://staging_user:****@staging-db:3306/${projectName}_staging`, secret: true },
        { key: "JWT_SECRET", value: "staging-secret-****", secret: true },
        { key: "CORS_ORIGIN", value: `https://staging.${projectName}.com`, secret: false },
        { key: "REDIS_URL", value: "redis://staging-redis:6379", secret: true },
      ],
    },
    {
      type: "production",
      label: "Production",
      icon: Globe,
      color: "text-primary",
      url: `https://${projectName}.com`,
      status: "inactive",
      variables: [
        { key: "NODE_ENV", value: "production", secret: false },
        { key: "PORT", value: "3000", secret: false },
        { key: "DATABASE_URL", value: `mysql://prod_user:****@prod-db:3306/${projectName}`, secret: true },
        { key: "JWT_SECRET", value: "prod-secret-****", secret: true },
        { key: "CORS_ORIGIN", value: `https://${projectName}.com`, secret: false },
        { key: "REDIS_URL", value: "redis://prod-redis:6379", secret: true },
        { key: "SMTP_HOST", value: "smtp.gmail.com", secret: false },
        { key: "SMTP_USER", value: "", secret: true },
        { key: "SMTP_PASS", value: "", secret: true },
      ],
    },
  ]);

  const currentEnv = environments.find(e => e.type === activeEnv)!;

  const handleAddVariable = () => {
    if (!newKey.trim()) return;
    setEnvironments(prev => prev.map(env =>
      env.type === activeEnv
        ? { ...env, variables: [...env.variables, { key: newKey.trim(), value: newValue, secret: newSecret }] }
        : env
    ));
    setNewKey("");
    setNewValue("");
    setNewSecret(false);
    toast({ title: "Variable added", description: `${newKey} added to ${currentEnv.label}` });
  };

  const handleRemoveVariable = (key: string) => {
    setEnvironments(prev => prev.map(env =>
      env.type === activeEnv
        ? { ...env, variables: env.variables.filter(v => v.key !== key) }
        : env
    ));
  };

  const handleCopyEnvFile = () => {
    const content = currentEnv.variables
      .map(v => `${v.key}=${v.secret && !showSecrets[v.key] ? "****" : v.value}`)
      .join("\n");
    navigator.clipboard.writeText(content);
    toast({ title: "Copied!", description: `${currentEnv.label} .env copied to clipboard.` });
  };

  const handleExportEnvFile = () => {
    const content = currentEnv.variables.map(v => `${v.key}=${v.value}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `.env.${activeEnv}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: `.env.${activeEnv} saved.` });
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStatusBadge = (status: Environment["status"]) => {
    switch (status) {
      case "active": return <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Active</Badge>;
      case "inactive": return <Badge variant="secondary" className="text-[9px]">Inactive</Badge>;
      case "deploying": return <Badge variant="secondary" className="text-[9px] bg-chart-5/10 text-chart-5 animate-pulse">Deploying</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Environments</span>
          <Badge variant="secondary" className="text-[10px]">3 envs</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopyEnvFile} className="gap-1 h-7 text-xs">
            <Copy className="w-3 h-3" /> Copy .env
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportEnvFile} className="gap-1 h-7 text-xs">
            Export
          </Button>
        </div>
      </div>

      {/* Environment tabs */}
      <div className="flex border-b border-border bg-card/50 shrink-0">
        {environments.map(env => (
          <button
            key={env.type}
            onClick={() => setActiveEnv(env.type)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2",
              activeEnv === env.type
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <env.icon className={cn("w-3.5 h-3.5", env.color)} />
            {env.label}
          </button>
        ))}
      </div>

      {/* Environment info */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <currentEnv.icon className={cn("w-4 h-4", currentEnv.color)} />
            <span className="text-xs font-medium text-foreground">{currentEnv.label}</span>
            {getStatusBadge(currentEnv.status)}
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{currentEnv.url}</span>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Variables list */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Environment Variables ({currentEnv.variables.length})
            </h3>
            {currentEnv.variables.map(v => (
              <div key={v.key} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {v.secret && <Lock className="w-3 h-3 text-chart-5" />}
                    <span className="text-xs font-mono font-medium text-foreground">{v.key}</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground mt-0.5 block truncate">
                    {v.secret && !showSecrets[v.key] ? "••••••••" : v.value || "(empty)"}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {v.secret && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSecret(v.key)}>
                      {showSecrets[v.key] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveVariable(v.key)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add variable */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Variable</h3>
            <div className="rounded-xl border border-border p-3 space-y-2 bg-card">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newKey}
                  onChange={e => setNewKey(e.target.value.toUpperCase())}
                  placeholder="KEY_NAME"
                  className="h-8 text-xs font-mono"
                />
                <Input
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  placeholder="value"
                  className="h-8 text-xs font-mono"
                  type={newSecret ? "password" : "text"}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSecret}
                    onChange={e => setNewSecret(e.target.checked)}
                    className="rounded"
                  />
                  <Lock className="w-3 h-3" /> Secret
                </label>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={handleAddVariable} disabled={!newKey.trim()}>
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
            </div>
          </div>

          {/* Quick info */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Infrastructure</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border p-2.5 bg-card text-center">
                <Globe className="w-4 h-4 mx-auto text-primary mb-1" />
                <span className="text-[10px] text-muted-foreground">Frontend</span>
                <p className="text-[11px] font-medium text-foreground">React</p>
              </div>
              <div className="rounded-lg border border-border p-2.5 bg-card text-center">
                <Server className="w-4 h-4 mx-auto text-chart-2 mb-1" />
                <span className="text-[10px] text-muted-foreground">Backend</span>
                <p className="text-[11px] font-medium text-foreground">Express</p>
              </div>
              <div className="rounded-lg border border-border p-2.5 bg-card text-center">
                <Database className="w-4 h-4 mx-auto text-chart-3 mb-1" />
                <span className="text-[10px] text-muted-foreground">Database</span>
                <p className="text-[11px] font-medium text-foreground">MySQL</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
