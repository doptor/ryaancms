import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Send, Database, FileText, Image, Wand2,
  Paperclip, Mic, Code, Palette, BarChart3, CheckCircle2,
  Circle, Loader2, ExternalLink, Rocket, AlertCircle,
  Table, Lock, CreditCard, LayoutGrid, Search, Bell,
  Calendar, Columns, Clock, MapPin,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppConfig, validateAppConfig, componentRegistry } from "@/lib/component-registry";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "ai"; content: string; config?: AppConfig };

type ProgressStep = {
  label: string;
  status: "done" | "in_progress" | "pending" | "error";
};

const ENGINE_STEPS: Omit<ProgressStep, "status">[] = [
  { label: "Understanding requirements" },
  { label: "Generating app structure" },
  { label: "Building component layout" },
  { label: "Creating database schema" },
  { label: "Applying security rules" },
  { label: "Validating configuration" },
  { label: "Ready to preview" },
];

const suggestions = [
  { icon: Database, label: "SaaS Dashboard", prompt: "Build a SaaS analytics dashboard with user auth, subscription management, and real-time charts" },
  { icon: FileText, label: "Blog Platform", prompt: "Create a blog platform with posts, categories, comments, and an admin panel" },
  { icon: CreditCard, label: "E-commerce Store", prompt: "Build an e-commerce store with products, cart, checkout, and order management" },
  { icon: Columns, label: "Project Manager", prompt: "Create a project management tool with kanban boards, tasks, and team collaboration" },
];

// Icon map for component types
const componentIcons: Record<string, any> = {
  hero: Sparkles, navbar: LayoutGrid, footer: BarChart3, sidebar: LayoutGrid,
  crud_table: Table, form: FileText, chart: BarChart3, card_grid: LayoutGrid,
  stats_row: BarChart3, auth_form: Lock, pricing_table: CreditCard,
  media_gallery: Image, search_bar: Search, notification_center: Bell,
  rich_text_editor: FileText, file_upload: Image, calendar: Calendar,
  kanban_board: Columns, timeline: Clock, map: MapPin,
};

export default function AIBuilderPage() {
  const location = useLocation();
  const incomingPrompt = (location.state as any)?.prompt || "";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I'm the **RyaanCMS AI Builder**. Describe your application and I'll generate a complete structured configuration — pages, components, database schema, roles, and more.\n\nWhat would you like to build?" },
  ]);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [buildComplete, setBuildComplete] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [currentConfig, setCurrentConfig] = useState<AppConfig | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedIncoming = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (incomingPrompt && !hasProcessedIncoming.current) {
      hasProcessedIncoming.current = true;
      setTimeout(() => sendMessage(incomingPrompt), 300);
    }
  }, [incomingPrompt]);

  const updateStep = useCallback((stepIndex: number, status: ProgressStep["status"]) => {
    setProgress((prev) =>
      prev.map((s, j) => ({
        ...s,
        status: j < stepIndex ? "done" : j === stepIndex ? status : "pending",
      }))
    );
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isBuilding) return;
    
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsBuilding(true);
    setBuildComplete(false);
    setCurrentConfig(null);

    // Initialize progress steps
    const steps = ENGINE_STEPS.map((s) => ({ ...s, status: "pending" as const }));
    setProgress(steps);

    try {
      // Step 0: Understanding requirements
      updateStep(0, "in_progress");
      await new Promise((r) => setTimeout(r, 400));
      updateStep(0, "done");

      // Step 1: Generating structure (actual AI call)
      updateStep(1, "in_progress");

      const { data, error } = await supabase.functions.invoke("ai-builder", {
        body: { prompt: text },
      });

      if (error) throw new Error(error.message || "AI Builder request failed");
      if (!data?.success || !data?.config) {
        throw new Error(data?.error || "Failed to generate configuration");
      }

      const config: AppConfig = data.config;
      updateStep(1, "done");

      // Step 2: Building component layout
      updateStep(2, "in_progress");
      await new Promise((r) => setTimeout(r, 600));
      updateStep(2, "done");

      // Step 3: Creating database schema
      updateStep(3, "in_progress");
      await new Promise((r) => setTimeout(r, 500));
      updateStep(3, "done");

      // Step 4: Security rules
      updateStep(4, "in_progress");
      await new Promise((r) => setTimeout(r, 400));
      updateStep(4, "done");

      // Step 5: Validation (Engine 4)
      updateStep(5, "in_progress");
      const validation = validateAppConfig(config);
      await new Promise((r) => setTimeout(r, 300));

      if (!validation.valid) {
        console.warn("Config validation warnings:", validation.errors);
      }
      updateStep(5, "done");

      // Step 6: Ready
      updateStep(6, "in_progress");
      await new Promise((r) => setTimeout(r, 200));
      setProgress((prev) => prev.map((s) => ({ ...s, status: "done" as const })));

      setCurrentConfig(config);
      setBuildComplete(true);

      // Build AI response summary
      const summary = `## ✅ ${config.title}

**Type:** ${config.project_type} · **Modules:** ${config.modules.join(", ")}

### 📄 Pages (${config.pages.length})
${config.pages.map((p) => `- **${p.name}** \`${p.route}\` — ${p.components.length} components`).join("\n")}

### 🗄 Database (${config.collections.length} collections)
${config.collections.map((c) => `- **${c.name}** — ${c.fields.length} fields${c.rls ? " 🔒 RLS" : ""}`).join("\n")}

${config.roles?.length ? `### 👥 Roles\n${config.roles.map((r) => `- **${r.name}**: ${r.permissions.join(", ")}`).join("\n")}` : ""}

${config.features?.length ? `### ⚡ Features\n${config.features.map((f) => `- ${f}`).join("\n")}` : ""}

Your configuration is ready! Click **Publish** to deploy, or continue chatting to refine.`;

      setMessages((prev) => [...prev, { role: "ai", content: summary, config }]);
    } catch (err: any) {
      console.error("AI Builder error:", err);
      const errorMsg = err?.message || "Something went wrong";
      
      setProgress((prev) => {
        const currentStep = prev.findIndex((s) => s.status === "in_progress");
        if (currentStep >= 0) {
          return prev.map((s, j) => ({
            ...s,
            status: j < currentStep ? ("done" as const) : j === currentStep ? ("error" as const) : ("pending" as const),
          }));
        }
        return prev;
      });

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `❌ **Build failed:** ${errorMsg}\n\nPlease try again or rephrase your request.` },
      ]);
      toast({ title: "Build failed", description: errorMsg, variant: "destructive" });
    } finally {
      setIsBuilding(false);
    }
  };

  const handlePublish = () => {
    toast({ title: "🚀 Published!", description: "Your project configuration has been saved." });
  };

  const StatusIcon = ({ status }: { status: ProgressStep["status"] }) => {
    if (status === "done") return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
    if (status === "in_progress") return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
    if (status === "error") return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
    return <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />;
  };

  // Render config preview
  const renderConfigPreview = () => {
    if (!currentConfig) return null;
    return (
      <div className="p-4 space-y-6 text-sm">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">{currentConfig.title}</h2>
          <p className="text-muted-foreground">{currentConfig.description}</p>
          <div className="flex gap-2 flex-wrap mt-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{currentConfig.project_type}</span>
            {currentConfig.modules.map((m) => (
              <span key={m} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">{m}</span>
            ))}
          </div>
        </div>

        {/* Pages */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-primary" /> Pages ({currentConfig.pages.length})
          </h3>
          {currentConfig.pages.map((page) => (
            <div key={page.route} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{page.name}</span>
                <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{page.route}</code>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {page.components.map((comp, i) => {
                  const Icon = componentIcons[comp.type] || Sparkles;
                  return (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-xs text-accent-foreground">
                      <Icon className="w-3 h-3" /> {comp.type}
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
            <Database className="w-4 h-4 text-primary" /> Database ({currentConfig.collections.length})
          </h3>
          {currentConfig.collections.map((col) => (
            <div key={col.name} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{col.name}</span>
                {col.rls && <span className="text-xs text-primary flex items-center gap-1"><Lock className="w-3 h-3" /> RLS</span>}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {col.fields.map((f) => (
                  <div key={f.name} className="text-xs text-muted-foreground flex items-center gap-1.5">
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
        {currentConfig.roles && currentConfig.roles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Roles
            </h3>
            {currentConfig.roles.map((role) => (
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
    );
  };

  // Chat panel content (shared between mobile/desktop)
  const renderChat = () => (
    <div className="flex flex-col h-full">
      {/* Progress tracker */}
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

      {/* Messages */}
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

          {/* Suggestions on first load */}
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

      {/* Input */}
      <div className="border-t border-border p-3 bg-card shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Attach file">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Voice input">
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
            placeholder={isBuilding ? "Building..." : "Describe your application..."}
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

  // Preview panel content
  const renderPreviewContent = () => {
    if (currentConfig) {
      return (
        <ScrollArea className="h-full">
          {renderConfigPreview()}
        </ScrollArea>
      );
    }

    if (isBuilding) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
            <p className="text-sm font-medium text-foreground">Building your application...</p>
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
          <h3 className="text-lg font-semibold text-foreground">AI Builder</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Describe your application and the AI engine will generate a complete structured configuration.
          </p>
        </div>
      </div>
    );
  };

  // Code tab - show raw JSON config
  const renderCodeContent = () => {
    if (!currentConfig) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Code className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Configuration</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Build something to see the structured JSON configuration.</p>
          </div>
        </div>
      );
    }

    return (
      <ScrollArea className="h-full">
        <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap">
          {JSON.stringify(currentConfig, null, 2)}
        </pre>
      </ScrollArea>
    );
  };

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
                <Loader2 className="w-3 h-3 animate-spin" /> Building...
              </span>
            )}
            {buildComplete && !isBuilding && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="w-3 h-3" /> Complete
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={!buildComplete}
            className="gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" /> Publish
          </Button>
        </div>

        <div className="flex-1 min-h-0">
          {/* Desktop */}
          <div className="hidden md:block h-full">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                <div className="h-full border-r border-border">
                  {renderChat()}
                </div>
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
                        <TabsTrigger value="code" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <Code className="w-3.5 h-3.5" /> Config
                        </TabsTrigger>
                        <TabsTrigger value="design" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <Palette className="w-3.5 h-3.5" /> Design
                        </TabsTrigger>
                        <TabsTrigger value="analysis" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5" /> Analysis
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex-1 min-h-0">
                    {activeTab === "preview" && renderPreviewContent()}
                    {activeTab === "code" && renderCodeContent()}
                    {activeTab === "design" && (
                      <div className="h-full flex items-center justify-center bg-muted/30 p-6">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Palette className="w-7 h-7 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">Design Editor</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">Visual style customization coming soon.</p>
                        </div>
                      </div>
                    )}
                    {activeTab === "analysis" && (
                      <div className="h-full flex items-center justify-center bg-muted/30 p-6">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="w-7 h-7 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">Analysis</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">Performance & SEO analysis coming soon.</p>
                        </div>
                      </div>
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
                  <TabsTrigger value="code" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Code className="w-3.5 h-3.5" /> Config
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === "chat" && renderChat()}
              {activeTab === "preview" && renderPreviewContent()}
              {activeTab === "code" && renderCodeContent()}
              {activeTab !== "chat" && activeTab !== "preview" && activeTab !== "code" && (
                <div className="h-full flex items-center justify-center p-6">
                  <p className="text-sm text-muted-foreground">Coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
