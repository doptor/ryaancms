import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Send, Database, FileText, CreditCard,
  Paperclip, Mic, Code, Palette, BarChart3, CheckCircle2,
  Circle, Loader2, ExternalLink, Rocket, AlertCircle,
  Table, Lock, LayoutGrid, Search, Bell,
  Calendar, Columns, Clock, MapPin, Download,
  Shield, AlertTriangle, Info, Image, Upload, FileCode2,
  TrendingUp, Link2, X, Eye, ChevronDown, ChevronUp,
  ArrowUp, Plus, Layers, RefreshCw, Package,
  GitBranch, Settings, History, Book, Container,
  Users, Activity,
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
} from "@/lib/engine";
import ReactMarkdown from "react-markdown";
import { AppPreviewRenderer } from "@/components/ai-builder/AppPreviewRenderer";
import { DeployPanel } from "@/components/ai-builder/DeployPanel";
import { PropEditorSidebar } from "@/components/ai-builder/PropEditorSidebar";
import { CodePanel, GeneratedFile } from "@/components/ai-builder/CodePanel";
import { QualityScorePanel } from "@/components/ai-builder/QualityScorePanel";
import { LivePreviewPanel } from "@/components/ai-builder/LivePreviewPanel";
import { ThemeSelector } from "@/components/ai-builder/ThemeSelector";
import { BuildSummaryPanel } from "@/components/ai-builder/BuildSummaryPanel";
import { AutoFixLoopPanel } from "@/components/ai-builder/AutoFixLoopPanel";
import { PluginGeneratorWizard } from "@/components/ai-builder/PluginGeneratorWizard";
import { WorkflowApiPanel } from "@/components/ai-builder/WorkflowApiPanel";
import { InstallerArchitecturePanel } from "@/components/ai-builder/InstallerArchitecturePanel";
import { ProjectHistoryPanel } from "@/components/ai-builder/ProjectHistoryPanel";
import { TimeMachinePanel } from "@/components/ai-builder/TimeMachinePanel";
import { DocsGeneratorPanel } from "@/components/ai-builder/DocsGeneratorPanel";
import { CICDExportPanel } from "@/components/ai-builder/CICDExportPanel";
import { CollaborationPanel } from "@/components/ai-builder/CollaborationPanel";
import { MonitoringPanel } from "@/components/ai-builder/MonitoringPanel";
import { supabase } from "@/integrations/supabase/client";
import { getThemePreset } from "@/lib/engine/theme-generator";

type Message = { role: "user" | "ai"; content: string };

type ProgressStep = {
  label: string;
  status: "done" | "in_progress" | "pending" | "error";
};

const STAGE_MAP: Record<PipelineStage, number> = {
  idle: -1,
  understanding: 0,
  planning: 2,
  architecting: 3,
  designing: 6,
  reviewing: 8,
  generating: 5,
  building_components: 10,
  generating_database: 11,
  validating_security: 12,
  finalizing: 13,
  complete: 14,
  error: -1,
};

const ENGINE_LABELS = [
  "🤖 Agent 1: Requirement Analyst",
  "📊 Agent 2: Product Manager",
  "📋 Agent 3: Task Planner",
  "🏗 Agent 4: System Architect",
  "🗄 Agent 5: Database Agent",
  "⚡ Agent 6: Backend Agent",
  "🎨 Agent 7: UI/UX Designer",
  "✍️ Agent 8: Copywriter",
  "🧪 Agent 9: Testing Agent",
  "🐛 Agent 10: Debugger Agent",
  "👁 Agent 11: UI Reviewer",
  "🔍 Agent 12: Quality Reviewer",
  "⚙️ Building components",
  "🗄 Generating database schema",
  "🔐 Security validation",
  "📦 Finalizing configuration",
  "✅ Pipeline complete",
];

const FRIENDLY_LABELS = [
  "Understanding your idea...",
  "Analyzing requirements...",
  "Creating a plan...",
  "Designing the architecture...",
  "Setting up the database...",
  "Building backend logic...",
  "Designing the interface...",
  "Writing premium copy...",
  "Running quality checks...",
  "Fixing potential issues...",
  "Reviewing UI quality...",
  "Final review...",
  "Assembling components...",
  "Preparing database...",
  "Checking security...",
  "Wrapping things up...",
  "All done!",
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
  trusted_by: TrendingUp, features_grid: LayoutGrid, feature_split: Columns,
  how_it_works: FileText, testimonials: Sparkles, faq: FileText, final_cta: Rocket,
  // Dynamic sections
  stats_banner: BarChart3, video_section: Eye, comparison_table: Table,
  integrations_grid: Link2, contact_form: FileText, newsletter_cta: Send,
  blog_preview: FileText, use_cases: LayoutGrid, team_section: Shield,
  cta_with_image: Rocket, logo_carousel: TrendingUp,
};

export default function AIBuilderPage() {
  const location = useLocation();
  const incomingPrompt = (location.state as any)?.prompt || "";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [previewMode, setPreviewMode] = useState<"visual" | "schema">("visual");
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<{ pageIndex: number; componentIndex: number } | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ text: string; prompt: string }[]>([]);
  const [isAutoImproving, setIsAutoImproving] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showAdvancedPipeline, setShowAdvancedPipeline] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedIncoming = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

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
      const startTime = Date.now();
      // Apply selected theme preset to orchestrator
      if (selectedThemeId) {
        const preset = getThemePreset(selectedThemeId);
        if (preset) {
          orchestrator.setThemePreset(preset);
        }
      }
      const result = await orchestrator.execute(text);
      const duration = Date.now() - startTime;
      setPipelineState(result);

      if (result.stage === "complete" && result.config) {
        const config = result.config;
        const v = result.validation;
        const schema = result.schema;

        // Set AI suggestions
        if (result.suggestions?.length) {
          setAiSuggestions(result.suggestions);
        }

        // Track build analytics + save project memory
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const allComponents = config.pages.flatMap((p) => p.components.map((c) => c.type));
            await supabase.from("build_analytics").insert({
              user_id: currentUser.id,
              prompt: text,
              project_title: config.title || "Untitled",
              components_used: allComponents,
              component_count: allComponents.length,
              page_count: config.pages.length,
              collection_count: config.collections.length,
              security_score: v?.score || (result.qualityScore?.overall_score || 0),
              status: "success",
              duration_ms: duration,
            });

            const { data: project } = await supabase.from("projects").insert({
              user_id: currentUser.id,
              prompt: text,
              title: config.title || "Untitled",
              status: "generated",
            }).select("id").single();

            if (project) {
              await supabase.from("project_memory").insert({
                user_id: currentUser.id,
                project_id: project.id,
                requirements: result.requirements || [],
                modules: config.modules || [],
                db_schema: config.collections || [],
                api_list: result.apiEndpoints || [],
                ui_components: allComponents || [],
                page_layouts: config.pages || [],
                task_plan: result.taskPlan || [],
                total_steps: result.taskPlan?.length || 0,
                current_step: result.taskPlan?.length || 0,
                quality_score: result.qualityScore || {},
                suggestions: result.suggestions || [],
                agent_log: result.agentLog || [],
                status: "complete",
              } as any);
            }
          }
        } catch {}

        const summary = [
          `## ✅ ${config.title}`,
          `**${config.project_type}** · ${config.modules.join(", ")}`,
          "",
          `📄 **${config.pages.length}** pages · 🗄 **${config.collections.length}** collections · 👥 **${config.roles?.length || 0}** roles`,
          "",
          ...(config.pages.length ? [
            ...config.pages.map((p) => `- **${p.name}** \`${p.route}\` — ${p.components.length} components`),
            "",
          ] : []),
          ...(result.qualityScore?.overall_score ? [
            `🏆 **Quality: ${result.qualityScore.overall_score}/100** · ${result.qualityVerdict}`,
            "",
          ] : []),
          ...(v ? [
            `🔐 **Security: ${v.score}/100** ${v.errors.length ? `· ${v.errors.length} issues` : "· All clear"}`,
            "",
          ] : []),
          "Your app is ready! Check the **Preview** tab to see it.",
        ].filter(Boolean).join("\n");

        setMessages((prev) => [...prev, { role: "ai", content: summary }]);
      } else if (result.error) {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            await supabase.from("build_analytics").insert({
              user_id: currentUser.id,
              prompt: text,
              status: "error",
              duration_ms: Date.now() - startTime,
            });
          }
        } catch {}

        setMessages((prev) => [
          ...prev,
          { role: "ai", content: `Something went wrong: ${result.error}\n\nTry describing your app differently.` },
        ]);
        toast({ title: "Build failed", description: result.error, variant: "destructive" });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `Something went wrong: ${err.message}` },
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

  const handlePropUpdate = (pageIndex: number, componentIndex: number, newProps: Record<string, any>) => {
    if (!pipelineState?.config) return;
    const updated = { ...pipelineState };
    const config = { ...updated.config! };
    const pages = [...config.pages];
    const page = { ...pages[pageIndex] };
    const components = [...page.components];
    components[componentIndex] = { ...components[componentIndex], props: newProps };
    page.components = components;
    pages[pageIndex] = page;
    config.pages = pages;
    updated.config = config;
    setPipelineState(updated);
  };

  const handleReorderComponents = (pageIndex: number, fromIndex: number, toIndex: number) => {
    if (!pipelineState?.config) return;
    const updated = { ...pipelineState };
    const config = { ...updated.config! };
    const pages = [...config.pages];
    const page = { ...pages[pageIndex] };
    const components = [...page.components];
    const [moved] = components.splice(fromIndex, 1);
    components.splice(toIndex, 0, moved);
    page.components = components;
    pages[pageIndex] = page;
    config.pages = pages;
    updated.config = config;
    setPipelineState(updated);
    if (selectedComponent?.pageIndex === pageIndex && selectedComponent?.componentIndex === fromIndex) {
      setSelectedComponent({ pageIndex, componentIndex: toIndex });
    }
  };

  const selectedComp = selectedComponent && pipelineState?.config
    ? pipelineState.config.pages[selectedComponent.pageIndex]?.components[selectedComponent.componentIndex] || null
    : null;

  const handleGenerateCode = async () => {
    if (!pipelineState?.config) return;
    setIsGeneratingCode(true);
    setGeneratedFiles([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-code", {
        body: { config: pipelineState.config },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Code generation failed");
      setGeneratedFiles(data.files || []);
      setActiveTab("code");
      toast({ title: "Code generated!", description: `${data.files?.length || 0} files created.` });
    } catch (err: any) {
      toast({ title: "Code generation failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleAutoImprove = async () => {
    if (!pipelineState?.config) return;
    setIsAutoImproving(true);
    const improvements = pipelineState.qualityImprovements || [];
    const improvementPrompt = `Improve the current project "${pipelineState.config.title}" based on these quality issues:\n${improvements.join("\n")}\n\nFix all issues and re-generate an improved version.`;
    await sendMessage(improvementPrompt);
    setIsAutoImproving(false);
  };

  const handleLoadProjectMemory = (memory: any) => {
    const restored: PipelineState = {
      stage: "complete", config: null, validation: null, schema: null, rbac: null,
      testSuite: null, docs: null, theme: null, error: null,
      requirements: memory.requirements || [], taskPlan: memory.task_plan || [],
      suggestions: memory.suggestions || [], apiEndpoints: memory.api_list || [],
      qualityScore: memory.quality_score || {}, qualityIssues: [], qualityImprovements: [],
      qualityVerdict: "", agentLog: memory.agent_log || [],
      workflows: memory.workflow ? [memory.workflow] : [], businessRules: [], permissionMatrix: [],
      folderStructure: memory.folder_structure || {}, testScenarios: [], seedData: [],
      bugs: [], autoFixes: [], riskScore: 0, webhooks: [], edgeFunctions: [],
      errorFixMemory: [], documentationPlan: [], documentationChecklist: {},
      securityChecklist: {}, defaultAdminCredentials: { email: "admin@admin.com", password: "admin123" },
      installerSteps: [], pluginHooks: [], middlewareStack: [], reusableComponents: [], prismaSchemaHint: "",
    };
    if (memory.modules || memory.page_layouts || memory.db_schema) {
      restored.config = {
        project_type: "saas", title: "Restored Project", description: "Loaded from project memory",
        modules: memory.modules || [], roles: [], features: [],
        pages: memory.page_layouts || [], collections: memory.db_schema || [],
        style: {}, multi_tenant: false,
      };
    }
    setPipelineState(restored);
    setActiveTab("preview");
  };

  const handleRestoreSnapshot = (snapshot: any) => {
    toast({ title: "Version selected", description: `"${snapshot.project_title}" — ${snapshot.page_count || 0} pages. Use Build History to fully reload.` });
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const prompt = `Replicate the UI layout from the uploaded screenshot "${file.name}". Create a similar design with matching structure, spacing, and component layout. Use modern React components.`;
    sendMessage(prompt);
  };

  const handleUrlReplicate = () => {
    if (!screenshotUrl.trim()) return;
    const prompt = `Replicate the UI layout from this website: ${screenshotUrl}. Analyze the page structure and create a similar design with matching layout, navigation, hero section, content sections, and footer. Use modern React components with Tailwind CSS.`;
    sendMessage(prompt);
    setScreenshotUrl("");
    setShowUrlInput(false);
  };

  const hasStarted = messages.length > 0;

  // === Building indicator ===
  const renderBuildingIndicator = () => {
    if (!isBuilding || progress.length === 0) return null;

    const doneCount = progress.filter(s => s.status === "done").length;
    const currentStep = progress.findIndex(s => s.status === "in_progress");
    const hasError = progress.some(s => s.status === "error");
    const percent = Math.round((doneCount / progress.length) * 100);
    const friendlyMsg = hasError
      ? "Something went wrong..."
      : currentStep >= 0
        ? FRIENDLY_LABELS[currentStep] || "Processing..."
        : doneCount === progress.length
          ? "Your app is ready!"
          : "Getting started...";

    return (
      <div className="mx-4 mb-3">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-3">
            {hasError ? (
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{friendlyMsg}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Step {Math.max(doneCount, 1)} of {progress.length}</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
          </div>
          <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                hasError ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvancedPipeline(!showAdvancedPipeline)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvancedPipeline ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showAdvancedPipeline ? "Hide details" : "Show details"}
          </button>

          {showAdvancedPipeline && (
            <div className="space-y-1 pt-1 border-t border-border">
              {progress.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {step.status === "done" ? <CheckCircle2 className="w-3 h-3 text-primary" /> :
                   step.status === "in_progress" ? <Loader2 className="w-3 h-3 text-primary animate-spin" /> :
                   step.status === "error" ? <AlertCircle className="w-3 h-3 text-destructive" /> :
                   <Circle className="w-3 h-3 text-muted-foreground/30" />}
                  <span className={cn(
                    "text-[11px]",
                    step.status === "done" ? "text-muted-foreground" :
                    step.status === "in_progress" ? "text-foreground font-medium" :
                    step.status === "error" ? "text-destructive" :
                    "text-muted-foreground/50"
                  )}>{step.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // === Welcome screen (Lovable-style) ===
  const renderWelcome = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
      <div className="max-w-2xl w-full text-center space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            What do you want to build?
          </h1>
          <p className="text-base text-muted-foreground">
            Describe your app and AI will generate everything — pages, database, auth, and more.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          {suggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => sendMessage(s.prompt)}
              className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card text-left hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.prompt}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // === Chat messages ===
  const renderMessages = () => (
    <ScrollArea className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3 animate-fade-in", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "ai" && (
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            )}>
              <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h2]:text-base [&_h2]:font-semibold [&_p]:leading-relaxed">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {/* Building indicator inline */}
        {isBuilding && renderBuildingIndicator()}

        {/* AI suggestions */}
        {aiSuggestions.length > 0 && !isBuilding && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Suggested next steps</p>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setAiSuggestions([]);
                      sendMessage(s.prompt);
                    }}
                    className="px-3 py-1.5 rounded-full border border-border bg-card text-xs text-foreground hover:border-primary/40 hover:bg-accent transition-all"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </ScrollArea>
  );

  // === Chat input (Lovable-style) ===
  const renderChatInput = () => (
    <div className="border-t border-border bg-card p-3 shrink-0">
      <div className="max-w-3xl mx-auto">
        {/* URL input for replication */}
        {showUrlInput && (
          <div className="flex items-center gap-2 mb-2">
            <input
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              placeholder="Paste website URL to replicate..."
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => e.key === "Enter" && handleUrlReplicate()}
            />
            <Button size="sm" variant="outline" onClick={handleUrlReplicate} className="gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Go
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowUrlInput(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleScreenshotUpload}
          className="hidden"
        />
        <div className="relative flex items-end gap-2 rounded-xl border border-input bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
          <div className="flex items-center gap-0.5 pl-1">
            <Button
              variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              title="Upload screenshot"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder={isBuilding ? "Building your app..." : "Describe what you want to build..."}
            rows={1}
            disabled={isBuilding}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[36px] max-h-[160px] py-2 disabled:opacity-50"
          />
          <Button
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg shrink-0 transition-all",
              input.trim() ? "opacity-100" : "opacity-50"
            )}
            onClick={() => sendMessage(input)}
            disabled={isBuilding || !input.trim()}
          >
            {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  // === Chat Panel (Lovable-style) ===
  const renderChat = () => (
    <div className="flex flex-col h-full bg-background">
      {hasStarted ? renderMessages() : renderWelcome()}
      {renderChatInput()}
    </div>
  );

  // === Preview Tab ===
  const renderPreview = () => {
    const config = pipelineState?.config;
    if (!config) {
      if (isBuilding) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Building your app...</p>
                <p className="text-xs text-muted-foreground">This usually takes a few seconds</p>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center space-y-3 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Preview</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your app preview will appear here after building.
            </p>
          </div>
        </div>
      );
    }

    const validation = pipelineState?.validation;

    return (
      <div className="flex flex-col h-full">
        {/* Preview toolbar */}
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
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Shield className="w-3 h-3" /> {validation.score}/100
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="sm"
              onClick={() => {
                if (pipelineState?.config) {
                  localStorage.setItem("ai-builder-preview-config", JSON.stringify(pipelineState.config));
                  window.open("/preview", "_blank");
                }
              }}
              className="gap-1 h-7 text-xs text-muted-foreground hover:text-foreground"
              title="Open preview in new tab"
            >
              <ExternalLink className="w-3 h-3" /> New Tab
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportJSON} className="gap-1 h-7 text-xs text-muted-foreground hover:text-foreground">
              <Download className="w-3 h-3" /> JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportSQL} className="gap-1 h-7 text-xs text-muted-foreground hover:text-foreground">
              <Download className="w-3 h-3" /> SQL
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {previewMode === "visual" ? (
            <div className="flex h-full">
              <div className="flex-1 min-w-0">
                <AppPreviewRenderer
                  config={config}
                  selectedComponent={selectedComponent}
                  onSelectComponent={(pi, ci) => setSelectedComponent({ pageIndex: pi, componentIndex: ci })}
                  onReorderComponents={handleReorderComponents}
                />
              </div>
              {selectedComponent && selectedComp && (
                <PropEditorSidebar
                  component={selectedComp}
                  componentIndex={selectedComponent.componentIndex}
                  pageIndex={selectedComponent.pageIndex}
                  onClose={() => setSelectedComponent(null)}
                  onUpdate={handlePropUpdate}
                />
              )}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6 text-sm">
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-foreground">{config.title}</h2>
                  <p className="text-muted-foreground">{config.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{config.project_type}</Badge>
                    {config.multi_tenant && <Badge variant="outline">🏢 Multi-tenant</Badge>}
                    {config.modules.map((m) => (
                      <Badge key={m} variant="outline">{m}</Badge>
                    ))}
                  </div>
                </div>

                {/* Pages */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-primary" /> Pages ({config.pages.length})
                  </h3>
                  {config.pages.map((page) => (
                    <div key={page.route} className="rounded-xl border border-border p-3 space-y-2">
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
                            <Badge key={i} variant="secondary" className="gap-1 text-[10px]">
                              <Icon className="w-3 h-3" /> {comp.type.replace(/_/g, " ")}
                            </Badge>
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
                    <div key={col.name} className="rounded-xl border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{col.name}</span>
                        <div className="flex items-center gap-2">
                          {col.rls && <Badge variant="secondary" className="text-[10px] gap-1"><Lock className="w-3 h-3" /> RLS</Badge>}
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
                      <div key={role.name} className="rounded-xl border border-border p-3">
                        <span className="font-medium text-foreground">{role.name}</span>
                        <div className="flex gap-1.5 flex-wrap mt-1.5">
                          {role.permissions.map((p) => (
                            <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
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

  // === Config Tab ===
  const renderConfig = () => {
    if (!pipelineState?.config) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Code className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Config</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Build something to see the configuration.</p>
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
            <p className="text-sm text-muted-foreground max-w-sm">Generated SQL will appear here.</p>
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

  // === Tab trigger style helper ===
  const tabTriggerClass = "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-1.5";

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">AI Builder</span>
            </div>
            {isBuilding && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                <span className="text-xs font-medium text-primary">Building...</span>
              </div>
            )}
            {buildComplete && !isBuilding && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">Ready</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeSelector selectedTheme={selectedThemeId} onSelect={setSelectedThemeId} />
            {buildComplete && (
              <>
                <Button variant="ghost" size="sm" onClick={handleExportJSON} className="gap-1.5 text-xs text-muted-foreground hidden sm:flex">
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
              </>
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
              <ResizablePanel defaultSize={38} minSize={28} maxSize={55}>
                <div className="h-full border-r border-border">{renderChat()}</div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={62} minSize={35}>
                <div className="flex flex-col h-full">
                  <div className="border-b border-border bg-card px-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="bg-transparent h-11 p-0 gap-0">
                        <TabsTrigger value="preview" className={tabTriggerClass}>
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </TabsTrigger>
                        <TabsTrigger value="config" className={tabTriggerClass}>
                          <Code className="w-3.5 h-3.5" /> Config
                        </TabsTrigger>
                        <TabsTrigger value="sql" className={tabTriggerClass}>
                          <Database className="w-3.5 h-3.5" /> SQL
                        </TabsTrigger>
                        <TabsTrigger value="security" className={tabTriggerClass}>
                          <Shield className="w-3.5 h-3.5" /> Security
                        </TabsTrigger>
                        <TabsTrigger value="quality" className={tabTriggerClass}>
                          <TrendingUp className="w-3.5 h-3.5" /> Quality
                        </TabsTrigger>
                        <TabsTrigger value="deploy" className={tabTriggerClass}>
                          <Rocket className="w-3.5 h-3.5" /> Deploy
                        </TabsTrigger>
                        <TabsTrigger value="summary" className={tabTriggerClass}>
                          <Layers className="w-3.5 h-3.5" /> Summary
                        </TabsTrigger>
                        <TabsTrigger value="code" className={tabTriggerClass}>
                          <FileCode2 className="w-3.5 h-3.5" /> Code
                          {generatedFiles.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 ml-1">{generatedFiles.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="live" className={tabTriggerClass}>
                          <Eye className="w-3.5 h-3.5" /> Live
                          {generatedFiles.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 ml-1">⚡</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="autofix" className={tabTriggerClass}>
                          <RefreshCw className="w-3.5 h-3.5" /> Auto-Fix
                        </TabsTrigger>
                        <TabsTrigger value="plugin" className={tabTriggerClass}>
                          <Package className="w-3.5 h-3.5" /> Plugin
                        </TabsTrigger>
                        <TabsTrigger value="workflow" className={tabTriggerClass}>
                          <GitBranch className="w-3.5 h-3.5" /> Workflow
                        </TabsTrigger>
                        <TabsTrigger value="installer" className={tabTriggerClass}>
                          <Settings className="w-3.5 h-3.5" /> Installer
                        </TabsTrigger>
                        <TabsTrigger value="history" className={tabTriggerClass}>
                          <History className="w-3.5 h-3.5" /> History
                        </TabsTrigger>
                        <TabsTrigger value="timemachine" className={tabTriggerClass}>
                          <Clock className="w-3.5 h-3.5" /> Versions
                        </TabsTrigger>
                        <TabsTrigger value="docs" className={tabTriggerClass}>
                          <Book className="w-3.5 h-3.5" /> Docs
                        </TabsTrigger>
                        <TabsTrigger value="cicd" className={tabTriggerClass}>
                          <Container className="w-3.5 h-3.5" /> CI/CD
                        </TabsTrigger>
                        <TabsTrigger value="collab" className={tabTriggerClass}>
                          <Users className="w-3.5 h-3.5" /> Team
                        </TabsTrigger>
                        <TabsTrigger value="monitor" className={tabTriggerClass}>
                          <Activity className="w-3.5 h-3.5" /> Monitor
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
                                pipelineState.validation.score >= 50 ? "bg-chart-5/10 text-chart-5" :
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
                                "flex items-start gap-2 p-3 rounded-xl border",
                                issue.severity === "error" ? "bg-destructive/5 border-destructive/20" :
                                issue.severity === "warning" ? "bg-chart-5/5 border-chart-5/20" :
                                "bg-muted/50 border-border"
                              )}>
                                {issue.severity === "error" ? <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" /> :
                                 issue.severity === "warning" ? <AlertTriangle className="w-4 h-4 text-chart-5 mt-0.5 shrink-0" /> :
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
                              <h3 className="text-lg font-semibold text-foreground">Security</h3>
                              <p className="text-sm text-muted-foreground max-w-sm">Build something to see security details.</p>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    )}
                    {activeTab === "quality" && (
                      <QualityScorePanel
                        pipelineState={pipelineState}
                        onAutoImprove={handleAutoImprove}
                        isImproving={isAutoImproving}
                      />
                    )}
                    {activeTab === "deploy" && (
                      <DeployPanel
                        config={pipelineState?.config || null}
                        sql={pipelineState?.schema?.sql}
                        onExportJSON={handleExportJSON}
                        onExportSQL={handleExportSQL}
                      />
                    )}
                    {activeTab === "summary" && (
                      <BuildSummaryPanel pipelineState={pipelineState} />
                    )}
                    {activeTab === "code" && (
                      <CodePanel
                        files={generatedFiles}
                        isGenerating={isGeneratingCode}
                        onGenerate={handleGenerateCode}
                        hasConfig={!!pipelineState?.config}
                      />
                    )}
                    {activeTab === "live" && (
                      <LivePreviewPanel
                        files={generatedFiles}
                        isGenerating={isGeneratingCode}
                        onGenerate={handleGenerateCode}
                        hasConfig={!!pipelineState?.config}
                      />
                    )}
                    {activeTab === "autofix" && (
                      <AutoFixLoopPanel
                        pipelineState={pipelineState}
                        onRetryBuild={() => pipelineState?.config && sendMessage(`Fix all issues and rebuild "${pipelineState.config.title}"`)}
                        isBuilding={isBuilding}
                      />
                    )}
                    {activeTab === "plugin" && (
                      <PluginGeneratorWizard
                        onGenerate={(plugin) => {
                          const prompt = `Generate a "${plugin.name}" plugin with entities: ${plugin.entities.map(e => e.name).join(", ")}. Include full CRUD, dashboard pages, permissions: ${plugin.permissions.join(", ")}. Slug: ${plugin.slug}`;
                          sendMessage(prompt);
                          toast({ title: "Plugin generation started!", description: `Building ${plugin.name} plugin...` });
                        }}
                      />
                    )}
                    {activeTab === "workflow" && (
                      <WorkflowApiPanel pipelineState={pipelineState} />
                    )}
                    {activeTab === "installer" && (
                      <InstallerArchitecturePanel pipelineState={pipelineState} />
                    )}
                    {activeTab === "history" && (
                      <ProjectHistoryPanel onLoadProject={handleLoadProjectMemory} />
                    )}
                    {activeTab === "timemachine" && (
                      <TimeMachinePanel onRestoreSnapshot={handleRestoreSnapshot} />
                    )}
                    {activeTab === "docs" && (
                      <DocsGeneratorPanel pipelineState={pipelineState} />
                    )}
                    {activeTab === "cicd" && (
                      <CICDExportPanel pipelineState={pipelineState} />
                    )}
                    {activeTab === "collab" && (
                      <CollaborationPanel pipelineState={pipelineState} isBuilding={isBuilding} />
                    )}
                    {activeTab === "monitor" && (
                      <MonitoringPanel pipelineState={pipelineState} isBuilding={isBuilding} />
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
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </TabsTrigger>
                  <TabsTrigger value="config" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Code className="w-3.5 h-3.5" /> Config
                  </TabsTrigger>
                  <TabsTrigger value="sql" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Database className="w-3.5 h-3.5" /> SQL
                  </TabsTrigger>
                  <TabsTrigger value="quality" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" /> Quality
                  </TabsTrigger>
                  <TabsTrigger value="deploy" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Rocket className="w-3.5 h-3.5" /> Deploy
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Layers className="w-3.5 h-3.5" /> Summary
                  </TabsTrigger>
                  <TabsTrigger value="code" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <FileCode2 className="w-3.5 h-3.5" /> Code
                  </TabsTrigger>
                  <TabsTrigger value="live" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Eye className="w-3.5 h-3.5" /> Live
                  </TabsTrigger>
                  <TabsTrigger value="autofix" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <RefreshCw className="w-3.5 h-3.5" /> Fix
                  </TabsTrigger>
                  <TabsTrigger value="plugin" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Package className="w-3.5 h-3.5" /> Plugin
                  </TabsTrigger>
                  <TabsTrigger value="workflow" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <GitBranch className="w-3.5 h-3.5" /> API
                  </TabsTrigger>
                  <TabsTrigger value="installer" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Settings className="w-3.5 h-3.5" /> Arch
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <History className="w-3.5 h-3.5" /> History
                  </TabsTrigger>
                  <TabsTrigger value="timemachine" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Clock className="w-3.5 h-3.5" /> Time
                  </TabsTrigger>
                  <TabsTrigger value="docs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Book className="w-3.5 h-3.5" /> Docs
                  </TabsTrigger>
                  <TabsTrigger value="cicd" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Container className="w-3.5 h-3.5" /> CI/CD
                  </TabsTrigger>
                  <TabsTrigger value="collab" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Users className="w-3.5 h-3.5" /> Team
                  </TabsTrigger>
                  <TabsTrigger value="monitor" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1 text-xs shrink-0">
                    <Activity className="w-3.5 h-3.5" /> Monitor
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === "chat" && renderChat()}
              {activeTab === "preview" && renderPreview()}
              {activeTab === "config" && renderConfig()}
              {activeTab === "sql" && renderSQL()}
              {activeTab === "quality" && (
                <QualityScorePanel
                  pipelineState={pipelineState}
                  onAutoImprove={handleAutoImprove}
                  isImproving={isAutoImproving}
                />
              )}
              {activeTab === "deploy" && (
                <DeployPanel
                  config={pipelineState?.config || null}
                  onExportJSON={handleExportJSON}
                  onExportSQL={handleExportSQL}
                />
              )}
              {activeTab === "summary" && (
                <BuildSummaryPanel pipelineState={pipelineState} />
              )}
              {activeTab === "code" && (
                <CodePanel
                  files={generatedFiles}
                  isGenerating={isGeneratingCode}
                  onGenerate={handleGenerateCode}
                  hasConfig={!!pipelineState?.config}
                />
              )}
              {activeTab === "live" && (
                <LivePreviewPanel
                  files={generatedFiles}
                  isGenerating={isGeneratingCode}
                  onGenerate={handleGenerateCode}
                  hasConfig={!!pipelineState?.config}
                />
              )}
              {activeTab === "autofix" && (
                <AutoFixLoopPanel
                  pipelineState={pipelineState}
                  onRetryBuild={() => pipelineState?.config && sendMessage(`Fix all issues and rebuild "${pipelineState.config.title}"`)}
                  isBuilding={isBuilding}
                />
              )}
              {activeTab === "plugin" && (
                <PluginGeneratorWizard
                  onGenerate={(plugin) => {
                    const prompt = `Generate a "${plugin.name}" plugin with entities: ${plugin.entities.map(e => e.name).join(", ")}. Include full CRUD, dashboard pages, permissions: ${plugin.permissions.join(", ")}. Slug: ${plugin.slug}`;
                    sendMessage(prompt);
                    toast({ title: "Plugin generation started!", description: `Building ${plugin.name} plugin...` });
                  }}
                />
              )}
              {activeTab === "workflow" && (
                <WorkflowApiPanel pipelineState={pipelineState} />
              )}
              {activeTab === "installer" && (
                <InstallerArchitecturePanel pipelineState={pipelineState} />
              )}
              {activeTab === "history" && (
                <ProjectHistoryPanel onLoadProject={handleLoadProjectMemory} />
              )}
              {activeTab === "timemachine" && (
                <TimeMachinePanel onRestoreSnapshot={handleRestoreSnapshot} />
              )}
              {activeTab === "docs" && (
                <DocsGeneratorPanel pipelineState={pipelineState} />
              )}
              {activeTab === "cicd" && (
                <CICDExportPanel pipelineState={pipelineState} />
              )}
              {activeTab === "collab" && (
                <CollaborationPanel pipelineState={pipelineState} isBuilding={isBuilding} />
              )}
              {activeTab === "monitor" && (
                <MonitoringPanel pipelineState={pipelineState} isBuilding={isBuilding} />
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
