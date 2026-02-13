import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Send, Database, FileText, CreditCard,
  Paperclip, Mic, Code, Palette, BarChart3, CheckCircle2,
  Circle, Loader2, ExternalLink, Rocket, AlertCircle,
  Table, Lock, LayoutGrid, Search, Bell,
  Calendar, Columns, Clock, MapPin, Download,
  Shield, AlertTriangle, Info, Image,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { toast } from "@/hooks/use-toast";
import {
  AIPipelineOrchestrator,
  PipelineStage,
  PipelineState,
  AppConfig,
  ValidationResult,
  GeneratedSchema,
} from "@/lib/engine";
import ReactMarkdown from "react-markdown";
import { AppPreviewRenderer } from "@/components/ai-builder/AppPreviewRenderer";

type Message = { role: "user" | "ai"; content: string };

type ProgressStep = {
  label: string;
  status: "done" | "in_progress" | "pending" | "error";
};

const STAGE_MAP: Record<PipelineStage, number> = {
  idle: -1,
  understanding: 0,
  generating: 1,
  building_components: 2,
  generating_database: 3,
  validating_security: 4,
  finalizing: 5,
  complete: 6,
  error: -1,
};

const ENGINE_LABELS = [
  "Engine 1: Understanding requirements",
  "Engine 1: Generating app config (AI)",
  "Engine 2: Building component layout",
  "Engine 3: Generating database schema",
  "Engine 4: Security validation",
  "Engine 5: Finalizing configuration",
  "✓ Pipeline complete",
];

const suggestions = [
  { icon: Database, label: "SaaS Dashboard", prompt: "Build a SaaS analytics dashboard with user auth, subscription tiers, real-time charts, and admin panel" },
  { icon: FileText, label: "Blog Platform", prompt: "Create a blog platform with posts, categories, comments, media gallery, and SEO optimization" },
  { icon: CreditCard, label: "E-commerce Store", prompt: "Build an e-commerce store with products, cart, checkout, orders, and inventory management" },
  { icon: Columns, label: "Project Manager", prompt: "Create a project management tool with kanban boards, tasks, team roles, and calendar view" },
];

const componentIcons: Record<string, any> = {
  hero: Sparkles, navbar: LayoutGrid, footer: BarChart3, sidebar: LayoutGrid,
  crud_table: Table, form: FileText, chart: BarChart3, card_grid: LayoutGrid,
  stats_row: BarChart3, auth_form: Lock, pricing_table: CreditCard,
  media_gallery: Image, search_bar: Search, notification_center: Bell,
  rich_text_editor: FileText, file_upload: Image, calendar: Calendar,
  kanban_board: Columns, timeline: Clock, map: MapPin,
  role_manager: Shield, payment_page: CreditCard, dashboard_layout: LayoutGrid,
  data_import: Image, settings_panel: BarChart3, api_docs: Code,
};

export default function AIBuilderPage() {
  const location = useLocation();
  const incomingPrompt = (location.state as any)?.prompt || "";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Welcome to **RyaanCMS AI Builder** — the structured application generation engine.\n\nDescribe what you want to build and I'll generate:\n- 📄 Page layouts with components\n- 🗄 Database schema with RLS\n- 🔐 Security validation\n- 👥 Roles & permissions\n\n**All output is structured JSON — no raw code generation.**" },
  ]);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [previewMode, setPreviewMode] = useState<"visual" | "schema">("visual");
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedIncoming = useRef(false);
  const orchestrator = useMemo(() => new AIPipelineOrchestrator(), []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (incomingPrompt && !hasProcessedIncoming.current) {
      hasProcessedIncoming.current = true;
      setTimeout(() => sendMessage(incomingPrompt), 300);
    }
  }, [incomingPrompt]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isBuilding) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsBuilding(true);
    setPipelineState(null);

    // Initialize progress
    const steps: ProgressStep[] = ENGINE_LABELS.map((label) => ({ label, status: "pending" }));
    setProgress(steps);

    // Listen to pipeline events
    const unsub = orchestrator.on((event) => {
      const stepIndex = STAGE_MAP[event.stage];
      if (stepIndex >= 0) {
        setProgress((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i < stepIndex ? "done" : i === stepIndex ? "in_progress" : s.status === "done" ? "done" : "pending",
          }))
        );
      }
      if (event.stage === "complete") {
        setProgress((prev) => prev.map((s) => ({ ...s, status: "done" })));
      }
      if (event.stage === "error") {
        setProgress((prev) => {
          const current = prev.findIndex((s) => s.status === "in_progress");
          return prev.map((s, i) => ({
            ...s,
            status: i < current ? "done" : i === current ? "error" : "pending",
          }));
        });
      }
    });

    try {
      const result = await orchestrator.execute(text);
      setPipelineState(result);

      if (result.stage === "complete" && result.config) {
        const config = result.config;
        const v = result.validation;
        const schema = result.schema;

        const summary = [
          `## ✅ ${config.title}`,
          `**Type:** ${config.project_type} · **Modules:** ${config.modules.join(", ")}`,
          "",
          `### 📄 Pages (${config.pages.length})`,
          ...config.pages.map((p) => `- **${p.name}** \`${p.route}\` — ${p.components.length} components (${p.layout})`),
          "",
          `### 🗄 Database (${config.collections.length} collections)`,
          ...config.collections.map((c) => `- **${c.name}** — ${c.fields.length} fields${c.rls ? " 🔒" : ""}${c.tenant_isolated ? " 🏢" : ""}`),
          "",
          ...(config.roles?.length ? [
            `### 👥 Roles`,
            ...config.roles.map((r) => `- **${r.name}**: ${r.permissions.join(", ")}`),
            "",
          ] : []),
          ...(v ? [
            `### 🔐 Security Score: ${v.score}/100`,
            v.errors.length ? `- ❌ ${v.errors.length} errors` : "",
            v.warnings.length ? `- ⚠️ ${v.warnings.length} warnings` : "",
            v.info.length ? `- ℹ️ ${v.info.length} info` : "",
            "",
          ] : []),
          ...(schema?.warnings.length ? [
            `### ⚠️ Schema Warnings`,
            ...schema.warnings.map((w) => `- ${w}`),
            "",
          ] : []),
          "Configuration ready! Check **Preview**, **Config**, and **SQL** tabs. Click **Publish** when satisfied.",
        ].filter(Boolean).join("\n");

        setMessages((prev) => [...prev, { role: "ai", content: summary }]);
      } else if (result.error) {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: `❌ **Pipeline failed:** ${result.error}\n\nPlease refine your prompt and try again.` },
        ]);
        toast({ title: "Build failed", description: result.error, variant: "destructive" });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `❌ **Error:** ${err.message}` },
      ]);
    } finally {
      unsub();
      setIsBuilding(false);
    }
  };

  const handlePublish = () => {
    toast({ title: "🚀 Published!", description: "Configuration saved successfully." });
  };

  const handleExportJSON = () => {
    const json = orchestrator.exportConfig();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pipelineState?.config?.title || "project"}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Configuration JSON downloaded." });
  };

  const handleExportSQL = () => {
    const sql = orchestrator.exportSQL();
    if (!sql) return;
    const blob = new Blob([sql], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pipelineState?.config?.title || "project"}-schema.sql`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "SQL schema downloaded." });
  };

  const buildComplete = pipelineState?.stage === "complete";

  const StatusIcon = ({ status }: { status: ProgressStep["status"] }) => {
    if (status === "done") return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
    if (status === "in_progress") return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
    if (status === "error") return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
    return <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />;
  };



  // === Preview Tab ===
  const renderPreview = () => {
    const config = pipelineState?.config;
    if (!config) {
      if (isBuilding) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
              <p className="text-sm font-medium text-foreground">Running AI pipeline...</p>
              <p className="text-xs text-muted-foreground">
                {progress.find((s) => s.status === "in_progress")?.label || "Processing..."}
              </p>
            </div>
          </div>
        );
      }
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">AI Builder Engine</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Describe your app to generate structured config through the 5-engine pipeline.
            </p>
          </div>
        </div>
      );
    }

    const validation = pipelineState?.validation;

    return (
      <div className="flex flex-col h-full">
        {/* Preview mode toggle */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setPreviewMode("visual")}
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  previewMode === "visual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                Visual
              </button>
              <button
                onClick={() => setPreviewMode("schema")}
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  previewMode === "schema" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                Schema
              </button>
            </div>
            {validation && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium",
                validation.score >= 80 ? "bg-primary/10 text-primary" :
                validation.score >= 50 ? "bg-yellow-500/10 text-yellow-600" :
                "bg-destructive/10 text-destructive"
              )}>
                🔐 {validation.score}/100
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-1 h-7 text-xs">
              <Download className="w-3 h-3" /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSQL} className="gap-1 h-7 text-xs">
              <Download className="w-3 h-3" /> SQL
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {previewMode === "visual" ? (
            <AppPreviewRenderer config={config} />
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6 text-sm">
                {/* Header */}
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-foreground">{config.title}</h2>
                  <p className="text-muted-foreground">{config.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{config.project_type}</span>
                    {config.multi_tenant && <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">🏢 Multi-tenant</span>}
                    {config.modules.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">{m}</span>
                    ))}
                  </div>
                </div>

                {/* Pages */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-primary" /> Pages ({config.pages.length})
                  </h3>
                  {config.pages.map((page) => (
                    <div key={page.route} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{page.name}</span>
                          {page.requires_auth && <Lock className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{page.route}</code>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {page.components.map((comp, i) => {
                          const Icon = componentIcons[comp.type] || Sparkles;
                          return (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-xs text-accent-foreground">
                              <Icon className="w-3 h-3" /> {comp.type.replace(/_/g, " ")}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collections */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" /> Database ({config.collections.length})
                  </h3>
                  {config.collections.map((col) => (
                    <div key={col.name} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{col.name}</span>
                        <div className="flex items-center gap-2">
                          {col.rls && <span className="text-xs text-primary flex items-center gap-1"><Lock className="w-3 h-3" /> RLS</span>}
                          {col.tenant_isolated && <span className="text-xs text-muted-foreground">🏢</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {col.fields.map((f) => (
                          <div key={f.name} className="text-xs flex items-center gap-1.5">
                            <span className="font-mono text-foreground">{f.name}</span>
                            <span className="text-muted-foreground/60">{f.type}</span>
                            {f.required && <span className="text-destructive">*</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Roles */}
                {config.roles && config.roles.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" /> Roles ({config.roles.length})
                    </h3>
                    {config.roles.map((role) => (
                      <div key={role.name} className="rounded-lg border border-border p-3">
                        <span className="font-medium text-foreground">{role.name}</span>
                        <div className="flex gap-1.5 flex-wrap mt-1.5">
                          {role.permissions.map((p) => (
                            <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{p}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    );
  };

  // === Config Tab (raw JSON) ===
  const renderConfig = () => {
    if (!pipelineState?.config) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Code className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Structured Config</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Build something to see the JSON configuration output.</p>
          </div>
        </div>
      );
    }
    return (
      <ScrollArea className="h-full">
        <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-all">
          {JSON.stringify(pipelineState.config, null, 2)}
        </pre>
      </ScrollArea>
    );
  };

  // === SQL Tab ===
  const renderSQL = () => {
    if (!pipelineState?.schema) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Database className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Database SQL</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Generated migration SQL will appear here.</p>
          </div>
        </div>
      );
    }
    return (
      <ScrollArea className="h-full">
        <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-all">
          {pipelineState.schema.sql}
        </pre>
      </ScrollArea>
    );
  };

  // === Chat Panel ===
  const renderChat = () => (
    <div className="flex flex-col h-full">
      {progress.length > 0 && (
        <div className="border-b border-border p-3 space-y-1.5 bg-card shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engine Pipeline</p>
          {progress.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <StatusIcon status={step.status} />
              <span className={cn(
                "text-xs",
                step.status === "done" ? "text-foreground" :
                step.status === "in_progress" ? "text-primary font-medium" :
                step.status === "error" ? "text-destructive" :
                "text-muted-foreground"
              )}>{step.label}</span>
            </div>
          ))}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}>
                {msg.role === "ai" && <Sparkles className="w-3.5 h-3.5 text-primary mb-1" />}
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {messages.length === 1 && !isBuilding && (
            <div className="grid grid-cols-1 gap-2 mt-4">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-card text-left hover:border-primary/30 hover:bg-accent/50 transition-all text-xs"
                >
                  <s.icon className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{s.label}</div>
                    <div className="text-muted-foreground truncate">{s.prompt}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3 bg-card shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder={isBuilding ? "Pipeline running..." : "Describe your application..."}
            rows={1}
            disabled={isBuilding}
            className="flex-1 resize-none px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[36px] max-h-[120px] disabled:opacity-50"
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => sendMessage(input)} disabled={isBuilding || !input.trim()}>
            {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-11 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">AI Builder</span>
            {isBuilding && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <Loader2 className="w-3 h-3 animate-spin" /> Pipeline running...
              </span>
            )}
            {buildComplete && !isBuilding && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="w-3 h-3" /> Complete
              </span>
            )}
            {pipelineState?.validation && buildComplete && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                pipelineState.validation.score >= 80 ? "bg-primary/10 text-primary" :
                pipelineState.validation.score >= 50 ? "bg-yellow-500/10 text-yellow-600" :
                "bg-destructive/10 text-destructive"
              )}>
                🔐 {pipelineState.validation.score}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {buildComplete && (
              <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-1.5 hidden sm:flex">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            )}
            <Button size="sm" onClick={handlePublish} disabled={!buildComplete} className="gap-1.5">
              <Rocket className="w-3.5 h-3.5" /> Publish
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {/* Desktop */}
          <div className="hidden md:block h-full">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                <div className="h-full border-r border-border">{renderChat()}</div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={65} minSize={40}>
                <div className="flex flex-col h-full">
                  <div className="border-b border-border bg-card px-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="bg-transparent h-11 p-0 gap-0">
                        <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" /> Preview
                        </TabsTrigger>
                        <TabsTrigger value="config" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <Code className="w-3.5 h-3.5" /> Config
                        </TabsTrigger>
                        <TabsTrigger value="sql" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <Database className="w-3.5 h-3.5" /> SQL
                        </TabsTrigger>
                        <TabsTrigger value="security" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> Security
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex-1 min-h-0">
                    {activeTab === "preview" && renderPreview()}
                    {activeTab === "config" && renderConfig()}
                    {activeTab === "sql" && renderSQL()}
                    {activeTab === "security" && (
                      <ScrollArea className="h-full">
                        {pipelineState?.validation ? (
                          <div className="p-4 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold",
                                pipelineState.validation.score >= 80 ? "bg-primary/10 text-primary" :
                                pipelineState.validation.score >= 50 ? "bg-yellow-500/10 text-yellow-600" :
                                "bg-destructive/10 text-destructive"
                              )}>
                                {pipelineState.validation.score}
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">Security Score</h3>
                                <p className="text-xs text-muted-foreground">
                                  {pipelineState.validation.errors.length} errors · {pipelineState.validation.warnings.length} warnings · {pipelineState.validation.info.length} info
                                </p>
                              </div>
                            </div>
                            {[...pipelineState.validation.errors, ...pipelineState.validation.warnings, ...pipelineState.validation.info].map((issue, i) => (
                              <div key={i} className={cn(
                                "flex items-start gap-2 p-3 rounded-lg border",
                                issue.severity === "error" ? "bg-destructive/5 border-destructive/20" :
                                issue.severity === "warning" ? "bg-yellow-500/5 border-yellow-500/20" :
                                "bg-muted/50 border-border"
                              )}>
                                {issue.severity === "error" ? <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" /> :
                                 issue.severity === "warning" ? <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" /> :
                                 <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                                <div>
                                  <p className="text-sm text-foreground">{issue.message}</p>
                                  {issue.category && <p className="text-xs text-muted-foreground mt-0.5">Category: {issue.category}</p>}
                                  {issue.fix && <p className="text-xs text-primary mt-1">💡 {issue.fix}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center p-6">
                            <div className="text-center space-y-3">
                              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Shield className="w-7 h-7 text-primary" />
                              </div>
                              <h3 className="text-lg font-semibold text-foreground">Security Report</h3>
                              <p className="text-sm text-muted-foreground max-w-sm">Build something to see the security validation report.</p>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex flex-col h-full overflow-hidden">
            <div className="border-b border-border bg-card px-2 shrink-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-transparent h-10 p-0 gap-0 w-full justify-start overflow-x-auto scrollbar-none">
                  <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Sparkles className="w-3.5 h-3.5" /> Chat
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" /> Preview
                  </TabsTrigger>
                  <TabsTrigger value="config" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Code className="w-3.5 h-3.5" /> Config
                  </TabsTrigger>
                  <TabsTrigger value="sql" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Database className="w-3.5 h-3.5" /> SQL
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === "chat" && renderChat()}
              {activeTab === "preview" && renderPreview()}
              {activeTab === "config" && renderConfig()}
              {activeTab === "sql" && renderSQL()}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
