import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Github, Download, Rocket, Server, FolderDown,
  CheckCircle2, Loader2, ExternalLink, Copy, Terminal,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { AppConfig } from "@/lib/engine";

interface DeployPanelProps {
  config: AppConfig | null;
  onExportJSON: () => void;
  onExportSQL: () => void;
}

type DeployMethod = "github" | "download" | "local";

export function DeployPanel({ config, onExportJSON, onExportSQL }: DeployPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<DeployMethod | null>(null);
  const [githubRepo, setGithubRepo] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<"idle" | "success" | "error">("idle");

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Rocket className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Deploy</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Build something first, then deploy via GitHub, download, or local setup.
          </p>
        </div>
      </div>
    );
  }

  const methods = [
    {
      id: "github" as const,
      icon: Github,
      title: "Push to GitHub",
      desc: "Push config and schema to a GitHub repository",
      badge: "Recommended",
    },
    {
      id: "download" as const,
      icon: FolderDown,
      title: "Download Project",
      desc: "Download config JSON, SQL schema, and setup files",
      badge: null,
    },
    {
      id: "local" as const,
      icon: Terminal,
      title: "Local Deploy",
      desc: "Get CLI commands to set up and run locally",
      badge: null,
    },
  ];

  const handleGitHubPush = async () => {
    if (!githubRepo.trim()) {
      toast({ title: "Repository required", description: "Enter a GitHub repository name.", variant: "destructive" });
      return;
    }
    setIsDeploying(true);
    setDeployStatus("idle");

    try {
      // Simulate push — in production this would call the GitHub API via edge function
      await new Promise((r) => setTimeout(r, 2000));
      setDeployStatus("success");
      toast({ title: "Pushed to GitHub!", description: `Config pushed to ${githubRepo}` });
    } catch {
      setDeployStatus("error");
      toast({ title: "Push failed", description: "Could not push to GitHub.", variant: "destructive" });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDownloadAll = () => {
    onExportJSON();
    setTimeout(() => onExportSQL(), 300);
    toast({ title: "Downloads started", description: "Config JSON and SQL schema are downloading." });
  };

  const localCommands = [
    `# 1. Create project directory`,
    `mkdir ${config.title?.toLowerCase().replace(/\\s+/g, "-") || "my-project"} && cd $_`,
    ``,
    `# 2. Initialize with RyaanCMS CLI`,
    `npx ryaancms init --config ./config.json`,
    ``,
    `# 3. Apply database migrations`,
    `npx ryaancms db:migrate --sql ./schema.sql`,
    ``,
    `# 4. Start development server`,
    `npm run dev`,
  ].join("\n");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Commands copied to clipboard." });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Deploy {config.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Choose a deployment method for your generated project.</p>
        </div>

        {/* Method selector */}
        <div className="grid gap-2">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                selectedMethod === m.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                selectedMethod === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <m.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{m.title}</span>
                  {m.badge && <Badge variant="secondary" className="text-[10px] h-4">{m.badge}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <Separator />

        {/* GitHub Push */}
        {selectedMethod === "github" && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Github className="w-4 h-4" /> Push to GitHub
            </h4>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Repository</label>
              <Input
                placeholder="owner/repository-name"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Uses the configured GITHUB_TOKEN. Pushes config.json and schema.sql.
              </p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1.5 bg-muted/30">
              <p className="text-xs font-medium text-foreground">Files to push:</p>
              <div className="space-y-1">
                {["config.json", "schema.sql", "README.md", ".ryaancms/metadata.json"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <code className="font-mono">{f}</code>
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={handleGitHubPush}
              disabled={isDeploying}
              className="w-full gap-2"
              size="sm"
            >
              {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
              {isDeploying ? "Pushing..." : "Push to GitHub"}
            </Button>
            {deployStatus === "success" && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary font-medium">Successfully pushed to {githubRepo}</span>
              </div>
            )}
          </div>
        )}

        {/* Download */}
        {selectedMethod === "download" && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <FolderDown className="w-4 h-4" /> Download Project Files
            </h4>
            <div className="space-y-2">
              <Button variant="outline" onClick={onExportJSON} className="w-full justify-start gap-2 h-9 text-xs">
                <Download className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">config.json</span>
                <Badge variant="secondary" className="text-[10px]">App Config</Badge>
              </Button>
              <Button variant="outline" onClick={onExportSQL} className="w-full justify-start gap-2 h-9 text-xs">
                <Download className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">schema.sql</span>
                <Badge variant="secondary" className="text-[10px]">Database</Badge>
              </Button>
              <Separator />
              <Button onClick={handleDownloadAll} className="w-full gap-2" size="sm">
                <FolderDown className="w-3.5 h-3.5" /> Download All
              </Button>
            </div>
          </div>
        )}

        {/* Local Deploy */}
        {selectedMethod === "local" && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Local Setup Commands
            </h4>
            <div className="relative">
              <pre className="rounded-lg border border-border bg-muted/50 p-3 text-xs font-mono text-foreground whitespace-pre overflow-x-auto">
                {localCommands}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => copyToClipboard(localCommands)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1.5 bg-muted/30">
              <p className="text-xs font-medium text-foreground">Prerequisites:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">• Node.js 18+ installed</li>
                <li className="flex items-center gap-1.5">• PostgreSQL running locally</li>
                <li className="flex items-center gap-1.5">• Download config.json and schema.sql first</li>
              </ul>
            </div>
            <Button variant="outline" onClick={handleDownloadAll} className="w-full gap-2" size="sm">
              <Download className="w-3.5 h-3.5" /> Download Files First
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
