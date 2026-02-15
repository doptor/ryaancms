import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles, Send, Database, FileText, CreditCard,
  Paperclip, Mic, Code, Palette, BarChart3, CheckCircle2,
  Circle, Loader2, ExternalLink, Rocket, AlertCircle,
  Table, Lock, LayoutGrid, Search, Bell,
  Calendar, Columns, Clock, MapPin, Download,
  Shield, AlertTriangle, Info, Image, Upload, FileCode2,
  TrendingUp, Link2, X, Eye, ChevronDown, ChevronUp, ChevronRight,
  ArrowUp, Plus, Layers, RefreshCw, Package,
  GitBranch, Settings, History, Book, Container,
  Users, Activity, FolderOpen, Server,
  Webhook, Bell as BellIcon, GitFork,
  Globe, Link, MicOff, MessageSquare, Smartphone,
  Bug,
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
import { ProjectSelector } from "@/components/ai-builder/ProjectSelector";
import { EnvironmentManagerPanel } from "@/components/ai-builder/EnvironmentManagerPanel";
import { WebhookNotificationPanel } from "@/components/ai-builder/WebhookNotificationPanel";
import { ProjectBranchingPanel } from "@/components/ai-builder/ProjectBranchingPanel";
import { DragDropBuilderPanel } from "@/components/ai-builder/DragDropBuilderPanel";
// AIChatAssistantPanel removed
import { BuildActivitySidebar, ActivityDetailView, type BuildActivity, type QueuedPrompt } from "@/components/ai-builder/BuildActivitySidebar";
import { DatabaseDesignerPanel } from "@/components/ai-builder/DatabaseDesignerPanel";
import { I18nGeneratorPanel } from "@/components/ai-builder/I18nGeneratorPanel";
import { SEOOptimizerPanel } from "@/components/ai-builder/SEOOptimizerPanel";
import { PerformancePanel } from "@/components/ai-builder/PerformancePanel";
import { MobileExportPanel } from "@/components/ai-builder/MobileExportPanel";
import { PaymentIntegrationPanel } from "@/components/ai-builder/PaymentIntegrationPanel";
import { CronJobPanel } from "@/components/ai-builder/CronJobPanel";
import { ComponentMarketplacePanel } from "@/components/ai-builder/ComponentMarketplacePanel";
import { TeamWorkspacePanel } from "@/components/ai-builder/TeamWorkspacePanel";
import { ApiDocsGeneratorPanel } from "@/components/ai-builder/ApiDocsGeneratorPanel";
import { WorkflowAutomationPanel } from "@/components/ai-builder/WorkflowAutomationPanel";
import { AdvancedAnalyticsPanel } from "@/components/ai-builder/AdvancedAnalyticsPanel";
import { ErrorBoundaryPanel } from "@/components/ai-builder/ErrorBoundaryPanel";
import { AccessibilityCheckerPanel } from "@/components/ai-builder/AccessibilityCheckerPanel";
import { BuildTargetGuide } from "@/components/ai-builder/BuildTargetGuide";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getThemePreset } from "@/lib/engine/theme-generator";
import { analyzePrompt, ProjectPhase, BuildTarget } from "@/lib/engine/prompt-analyzer";
import { generateProjectCode } from "@/lib/engine/code-generator";
import { STARTER_TEMPLATES, type StarterTemplate } from "@/lib/engine/template-library";
import JSZip from "jszip";

type BuildTask = {
  label: string;
  status: "done" | "in_progress" | "pending";
};

type Message = {
  role: "user" | "ai";
  content: string;
  thinkingTime?: number;
  tasks?: BuildTask[];
  editedFiles?: string[];
};

type ProgressStep = {
  label: string;
  status: "done" | "in_progress" | "pending" | "error";
  errorDetail?: string;
  agentData?: any;
  provider?: string;
  model?: string;
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
  const { user } = useAuth();
  const incomingPrompt = (location.state as any)?.prompt || "";
  const incomingProjectId = (location.state as any)?.projectId || null;
  const incomingIsNew = (location.state as any)?.isNew || false;
  const incomingContentType = (location.state as any)?.contentType || null;
  const [input, setInput] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem("ai-builder-active-tab") || "chat"; } catch { return "chat"; }
  });
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
  const [currentProject, setCurrentProject] = useState<{ id: string; title: string | null; prompt: string; status: string; created_at: string; updated_at: string; logo_url?: string | null; brand_name?: string | null } | null>(null);
  const [phasePlan, setPhasePlan] = useState<ProjectPhase[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [awaitingPhaseConfirm, setAwaitingPhaseConfirm] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showContentType, setShowContentType] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<string>(incomingContentType || "website");
  const [showColorPresets, setShowColorPresets] = useState(false);
  const [buildElapsed, setBuildElapsed] = useState(0);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [promptQueue, setPromptQueue] = useState<QueuedPrompt[]>([]);
  const [buildActivities, setBuildActivities] = useState<BuildActivity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const isProcessingQueue = useRef(false);
  const queueCancelledRef = useRef(false);
  const buildTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buildStartTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedIncoming = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const orchestrator = useMemo(() => new AIPipelineOrchestrator(), []);
  const currentProjectRef = useRef(currentProject);
  useEffect(() => { currentProjectRef.current = currentProject; }, [currentProject]);
  useEffect(() => { try { localStorage.setItem("ai-builder-active-tab", activeTab); } catch {} }, [activeTab]);
  // Persist current project ID so refresh restores the same project
  useEffect(() => {
    if (currentProject?.id) {
      try { localStorage.setItem("ai-builder-active-project-id", currentProject.id); } catch {}
    }
  }, [currentProject?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Auto-send prompt for NEW projects created from dashboard prompt box.
    // incomingIsNew distinguishes "just created" from "clicked existing project".
    if (incomingPrompt && !hasProcessedIncoming.current && !isRestoring && (incomingIsNew || !incomingProjectId)) {
      hasProcessedIncoming.current = true;
      window.history.replaceState({}, document.title);
      setTimeout(() => sendMessage(incomingPrompt), 300);
    }
  }, [incomingPrompt, isRestoring, incomingProjectId, incomingIsNew]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 300) + "px";
    }
  }, [input]);

  // Auto-restore last active project on mount (read-only, no creation)
  // Load project from navigation state (clicked from dashboard)
  useEffect(() => {
    if (!user || !incomingProjectId) return;
    // For NEW projects (from dashboard prompt), do NOT set hasProcessedIncoming here
    // — let the auto-send effect handle it so the build starts automatically.
    if (!incomingIsNew) {
      hasProcessedIncoming.current = true;
      window.history.replaceState({}, document.title);
    }
    if (currentProject?.id === incomingProjectId) { setIsRestoring(false); return; }
    const loadIncomingProject = async () => {
      try {
        const { data } = await supabase
          .from("projects")
          .select("*")
          .eq("id", incomingProjectId)
          .eq("user_id", user.id)
          .single();
        if (data) {
          setCurrentProject(data);
          currentProjectRef.current = data;
          localStorage.setItem("ai-builder-active-project-id", data.id);
          // For NEW projects, skip memory loading — just set project and let auto-send handle build
          if (incomingIsNew) {
            setIsRestoring(false);
            return;
          }
          // Load memory for existing projects
          const { data: memory } = await supabase
            .from("project_memory")
            .select("*")
            .eq("project_id", data.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          if (memory) {
            const restored: PipelineState = {
              stage: "complete", config: null, validation: null, schema: null, rbac: null,
              testSuite: null, docs: null, theme: null, error: null,
              requirements: (memory.requirements as any) || [], taskPlan: (memory.task_plan as any) || [],
              suggestions: (memory.suggestions as any) || [], apiEndpoints: (memory.api_list as any) || [],
              qualityScore: (memory.quality_score as any) || {}, qualityIssues: [], qualityImprovements: [],
              qualityVerdict: "", agentLog: (memory.agent_log as any) || [],
              workflows: memory.workflow ? [memory.workflow as any] : [], businessRules: [], permissionMatrix: [],
              folderStructure: (memory.folder_structure as any) || {}, testScenarios: [], seedData: [],
              bugs: [], autoFixes: [], riskScore: 0, webhooks: [], edgeFunctions: [],
              errorFixMemory: [], documentationPlan: [], documentationChecklist: {},
              securityChecklist: {}, defaultAdminCredentials: { email: "admin@admin.com", password: "admin123" },
              installerSteps: [], pluginHooks: [], middlewareStack: [], reusableComponents: [], prismaSchemaHint: "",
            };
            if (memory.modules || memory.page_layouts || memory.db_schema) {
              restored.config = {
                project_type: "saas", build_target: "application", title: data.title || "Restored Project", description: data.prompt || "",
                modules: (memory.modules as any) || [], roles: [], features: [],
                pages: (memory.page_layouts as any) || [], collections: (memory.db_schema as any) || [],
                style: {}, multi_tenant: false,
              };
            }
            // Try to load richer config from published_previews (has prop customizations like backgrounds, content blocks)
            try {
              const { data: preview } = await supabase.from("published_previews").select("config").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
              if (preview?.config && (preview.config as any).pages?.length > 0) {
                const previewConfig = preview.config as any;
                // Use published config if it matches the same project (by title or has more data)
                if (restored.config && previewConfig.title === restored.config.title) {
                  restored.config = previewConfig;
                } else if (!restored.config) {
                  restored.config = previewConfig;
                }
              }
            } catch {}
            // Also check localStorage for most recent edits
            try {
              const stored = localStorage.getItem("ai-builder-preview-config");
              if (stored) {
                const localConfig = JSON.parse(stored);
                if (localConfig?.pages?.length > 0 && restored.config && localConfig.title === restored.config.title) {
                  restored.config = localConfig;
                }
              }
            } catch {}
            setPipelineState(restored);
            const agentLog = memory.agent_log as any[] || [];
            const convEntry = agentLog.find((e: any) => e?.type === "conversation");
            if (convEntry?.messages?.length) {
              setMessages(convEntry.messages);
            } else {
              setMessages([
                { role: "ai", content: `✅ Restored project: **${data.brand_name || data.title || "Untitled"}**` }
              ]);
            }
          }
        }
      } catch {}
      setIsRestoring(false);
    };
    loadIncomingProject();
  }, [user, incomingProjectId]);

  // Auto-restore last active project on mount (read-only, no creation)
  useEffect(() => {
    if (!user) { setIsRestoring(false); return; }
    if (currentProject || incomingProjectId || hasProcessedIncoming.current) { setIsRestoring(false); return; }
    const restoreLastProject = async () => {
      try {
        // Try to restore the exact project the user was viewing
        let savedProjectId: string | null = null;
        try { savedProjectId = localStorage.getItem("ai-builder-active-project-id"); } catch {}

        let project: any = null;
        if (savedProjectId) {
          const { data } = await supabase
            .from("projects")
            .select("*")
            .eq("id", savedProjectId)
            .eq("user_id", user.id)
            .single();
          if (data) project = data;
        }
        // Fallback: most recently updated project
        if (!project) {
          const { data: projects } = await supabase
            .from("projects")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1);
          if (!projects || projects.length === 0) { setIsRestoring(false); return; }
          project = projects[0];
        }
        setCurrentProject(project);
        currentProjectRef.current = project;
        const { data: memory } = await supabase
          .from("project_memory")
          .select("*")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (memory) {
          const restored: PipelineState = {
            stage: "complete", config: null, validation: null, schema: null, rbac: null,
            testSuite: null, docs: null, theme: null, error: null,
            requirements: (memory.requirements as any) || [], taskPlan: (memory.task_plan as any) || [],
            suggestions: (memory.suggestions as any) || [], apiEndpoints: (memory.api_list as any) || [],
            qualityScore: (memory.quality_score as any) || {}, qualityIssues: [], qualityImprovements: [],
            qualityVerdict: "", agentLog: (memory.agent_log as any) || [],
            workflows: memory.workflow ? [memory.workflow as any] : [], businessRules: [], permissionMatrix: [],
            folderStructure: (memory.folder_structure as any) || {}, testScenarios: [], seedData: [],
            bugs: [], autoFixes: [], riskScore: 0, webhooks: [], edgeFunctions: [],
            errorFixMemory: [], documentationPlan: [], documentationChecklist: {},
            securityChecklist: {}, defaultAdminCredentials: { email: "admin@admin.com", password: "admin123" },
            installerSteps: [], pluginHooks: [], middlewareStack: [], reusableComponents: [], prismaSchemaHint: "",
          };
           if (memory.modules || memory.page_layouts || memory.db_schema) {
              restored.config = {
                project_type: "saas", build_target: "application", title: project.title || "Restored Project", description: project.prompt || "Loaded from project memory",
                modules: (memory.modules as any) || [], roles: [], features: [],
                pages: (memory.page_layouts as any) || [], collections: (memory.db_schema as any) || [],
                style: {}, multi_tenant: false,
              };
            }
            // Try to load richer config from published_previews (has prop customizations like backgrounds, content blocks)
            try {
              const { data: preview } = await supabase.from("published_previews").select("config").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
              if (preview?.config && (preview.config as any).pages?.length > 0) {
                const previewConfig = preview.config as any;
                if (restored.config && previewConfig.title === restored.config.title) {
                  restored.config = previewConfig;
                } else if (!restored.config) {
                  restored.config = previewConfig;
                }
              }
            } catch {}
            // Also check localStorage for most recent edits
            try {
              const stored = localStorage.getItem("ai-builder-preview-config");
              if (stored) {
                const localConfig = JSON.parse(stored);
                if (localConfig?.pages?.length > 0 && restored.config && localConfig.title === restored.config.title) {
                  restored.config = localConfig;
                }
              }
            } catch {}
          setPipelineState(restored);
          // Don't override activeTab — let localStorage persistence handle it
          const agentLog = memory.agent_log as any[] || [];
          const convEntry = agentLog.find((e: any) => e?.type === "conversation");
          if (convEntry?.messages?.length) {
            setMessages(convEntry.messages);
          } else {
            setMessages([{ role: "ai", content: `📂 Restored project **${project.title || "Untitled"}**. Continue building or start fresh!` }]);
          }
        } else {
          setMessages([{ role: "ai", content: `📂 Loaded project **${project.title || "Untitled"}**. Send a prompt to start building!` }]);
        }
      } catch (err) {
        console.error("Failed to restore project:", err);
      } finally {
        setIsRestoring(false);
      }
    };
    restoreLastProject();
  }, [user]);

  // Auto-save conversation to project memory
  const saveConversation = useCallback(async (msgs: Message[]) => {
    if (!currentProject?.id || !user) return;
    try {
      // Fetch existing memory to merge conversation into agent_log
      const { data: existing } = await supabase
        .from("project_memory")
        .select("agent_log")
        .eq("project_id", currentProject.id)
        .maybeSingle();

      const existingLog = (existing?.agent_log as any[]) || [];
      // Replace or add conversation entry
      const filteredLog = existingLog.filter((e: any) => e?.type !== "conversation");
      const mergedLog = [...filteredLog, { type: "conversation", messages: msgs }];

      await supabase.from("project_memory").upsert({
        user_id: user.id,
        project_id: currentProject.id,
        agent_log: mergedLog,
        status: pipelineState?.stage === "complete" ? "complete" : "in_progress",
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "project_id" });
    } catch {}
  }, [currentProject?.id, user, pipelineState?.stage]);

  // Queue processor
  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current) return;
    isProcessingQueue.current = true;
    queueCancelledRef.current = false;

    while (true) {
      if (queueCancelledRef.current) break;
      const next = promptQueue.find(q => q.status === "queued");
      if (!next) break;

      setPromptQueue(prev => prev.map(q => q.id === next.id ? { ...q, status: "building" } : q));
      setMessages(prev => [...prev, { role: "user", content: next.text }]);
      await executeBuild(next.text);
      setPromptQueue(prev => prev.map(q => q.id === next.id ? { ...q, status: "done" } : q));
    }

    isProcessingQueue.current = false;
  }, [promptQueue]);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    queueCancelledRef.current = true;
    setPromptQueue(prev => prev.filter(q => q.status !== "queued"));
    toast({ title: "🛑 Queue cleared", description: "All pending prompts have been removed." });
  }, []);

  // Auto-process queue when building finishes
  useEffect(() => {
    if (!isBuilding && promptQueue.some(q => q.status === "queued")) {
      processQueue();
    }
  }, [isBuilding, promptQueue]);

  // Detect if user input is a question (not a build prompt)
  const isQuestion = useCallback((text: string): boolean => {
    const t = text.trim().toLowerCase();
    // Starts with question words
    if (/^(what|how|why|when|where|who|which|can|could|is|are|do|does|did|will|would|should|tell me|explain|describe|show me|help me understand)[\s?]/.test(t)) return true;
    // Ends with question mark
    if (t.endsWith("?")) return true;
    // Common conversational patterns that are NOT build requests
    if (/^(hi|hello|hey|thanks|thank you|ok|okay|sure|great|nice|good|awesome)\b/.test(t) && t.length < 60) return true;
    return false;
  }, []);

  // Handle Q&A via AI streaming
  const handleQA = useCallback(async (question: string, msgs: Message[]) => {
    // Gather project context for the AI
    const projectContext = {
      title: currentProject?.title,
      prompt: currentProject?.prompt,
      status: currentProject?.status,
      pages: pipelineState?.config?.pages || [],
      modules: pipelineState?.config?.modules || [],
      collections: pipelineState?.config?.collections || [],
    };

    let assistantContent = "";
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "ai" && last.content === assistantContent.slice(0, -chunk.length) || last?.role === "ai" && assistantContent.startsWith(last.content.slice(0, 20))) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "ai" as const, content: assistantContent }];
      });
    };

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-qa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ question, projectContext }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({ error: "AI service unavailable" }));
        setMessages(prev => [...prev, { role: "ai", content: `⚠️ ${errorData.error || "Could not get a response. Please try again."}` }]);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {}
        }
      }

      // Save conversation with the AI response
      setMessages(prev => {
        saveConversation(prev);
        return prev;
      });
    } catch (err) {
      console.error("Q&A error:", err);
      setMessages(prev => [...prev, { role: "ai", content: "⚠️ Something went wrong. Please try again." }]);
    }
  }, [currentProject, pipelineState, saveConversation]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // If already building, add to queue
    if (isBuilding) {
      const queueItem: QueuedPrompt = {
        id: crypto.randomUUID(),
        text: text.trim(),
        status: "queued",
        addedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setPromptQueue(prev => [...prev, queueItem]);
      setInput("");
      toast({ title: "📋 Added to queue", description: `"${text.slice(0, 50)}..." will run after current build.` });
      return;
    }

    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    saveConversation(newMessages);

    // Check if user is confirming next phase
    const isPhaseConfirm = awaitingPhaseConfirm && /^(yes|sure|go|ok|okay|continue|next|proceed|start|let'?s?\s*(go|do|start|build)|build|phase)/i.test(text.trim());

    if (isPhaseConfirm && phasePlan.length > 0 && currentPhaseIndex < phasePlan.length) {
      setAwaitingPhaseConfirm(false);
      const phase = phasePlan[currentPhaseIndex];
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `⚡ Great! Starting **Phase ${phase.phase}: ${phase.title}**...\n\n_${phase.description}_` },
      ]);
      await new Promise(r => setTimeout(r, 500));
      await executeBuild(phase.prompt);
      return;
    }

    // === Q&A Detection: answer questions instead of building ===
    if (isQuestion(text) && !awaitingPhaseConfirm) {
      await handleQA(text, newMessages);
      return;
    }

    // Smart step detection — pass hasExistingProject so analyzer knows this is an update
    const hasExistingProject = !!currentProjectRef.current || !!pipelineState?.config;
    const analysis = analyzePrompt(text, hasExistingProject);

    // For full-scope projects with phases — go conversational
    if (analysis.scope === "full" && analysis.phases && analysis.phases.length > 1) {
      setOriginalPrompt(text);
      setPhasePlan(analysis.phases);
      setCurrentPhaseIndex(0);
      setAwaitingPhaseConfirm(true);

      const phaseList = analysis.phases.map((p) =>
        `**Phase ${p.phase}: ${p.title}**\n  _${p.description}_`
      ).join("\n\n");

      const BUILD_TARGET_LABELS: Record<BuildTarget, string> = {
        "website": "🌐 Website",
        "application": "📱 Application",
        "plugin": "🧩 Plugin",
        "website+application": "🌐+📱 Website + Application",
        "application+plugin": "📱+🧩 Application + Plugin",
        "full": "🌐+📱+🧩 Full Stack (Website + App + Plugin)",
      };

      const conversationalMsg = [
        analysis.appreciation || "🚀 Great project idea!",
        "",
        `**Build Type Detected:** ${BUILD_TARGET_LABELS[analysis.buildTarget]}`,
        "",
        `I can see this is a comprehensive project with a lot of moving parts. To make sure everything is built properly, I'd like to split this into **${analysis.phases.length} phases**:`,
        "",
        phaseList,
        "",
        "---",
        "",
        `🎯 **Ready to start Phase 1: ${analysis.phases[0].title}?**`,
        "",
        '_Type "yes" or "go" to begin, or tell me if you\'d like to adjust the plan!_',
      ].join("\n");

      setMessages((prev) => {
        const updated = [...prev, { role: "ai" as const, content: conversationalMsg }];
        saveConversation(updated);
        return updated;
      });
      return;
    }

    // For non-full scope — build directly
    await executeBuild(text);
  };

  const executeBuild = async (buildPrompt: string) => {
    setIsBuilding(true);
    // Preserve previous config so preview isn't lost if build fails
    const previousConfig = pipelineState?.config || null;
    setPipelineState(null);
    setBuildElapsed(0);
    setSelectedActivityId(null);
    buildStartTimeRef.current = Date.now();
    buildTimerRef.current = setInterval(() => {
      setBuildElapsed(Math.round((Date.now() - buildStartTimeRef.current) / 1000));
    }, 1000);

    const hasExistingProject = !!currentProjectRef.current || !!previousConfig;
    const analysis = analyzePrompt(buildPrompt, hasExistingProject);
    const relevantSteps = analysis.stepsNeeded;

    // === Build Activities: Understanding phase ===
    const understandingActivity: BuildActivity = {
      id: crypto.randomUUID(),
      title: "Understanding your request",
      description: analysis.reason,
      status: "done",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      details: { type: "understanding", data: { scope: analysis.scope, buildTarget: analysis.buildTarget, reason: analysis.reason, stepsNeeded: analysis.stepsNeeded } },
    };
    const planActivity: BuildActivity = {
      id: crypto.randomUUID(),
      title: "Creating execution plan",
      description: `${relevantSteps.length} pipeline steps planned`,
      status: "done",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      details: { type: "plan", data: { tasks: relevantSteps.map(i => ENGINE_LABELS[i] || `Step ${i}`) } },
    };
    const buildingActivity: BuildActivity = {
      id: crypto.randomUUID(),
      title: "Building application",
      description: "Executing pipeline...",
      status: "in_progress",
    };
    setBuildActivities([understandingActivity, planActivity, buildingActivity]);

    // Show understanding summary in chat
    const BUILD_SCOPE_LABELS: Record<string, string> = {
      micro: "⚡ Quick Edit", light: "🔧 Light Update", moderate: "🏗 Standard Build", full: "🚀 Full Build",
    };
    setMessages(prev => [...prev, {
      role: "ai",
      content: `${BUILD_SCOPE_LABELS[analysis.scope] || "🏗 Build"} — **${analysis.buildTarget}**\n\n📋 **What I understood:**\n_${analysis.reason}_\n\n⚙️ Running **${relevantSteps.length} pipeline steps**...`,
    }]);

    // Only show relevant steps
    const steps: ProgressStep[] = ENGINE_LABELS
      .map((label, i) => ({ label, index: i, status: relevantSteps.includes(i) ? "pending" as const : "done" as const }))
      .filter(s => relevantSteps.includes(s.index))
      .map(s => ({ label: s.label, status: s.status }));
    setProgress(steps);

    // Show scope info in chat for transparency
    if (analysis.scope === "micro" || analysis.scope === "light") {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `⚡ **${analysis.scope === "micro" ? "Quick Edit" : "Light Update"}** detected — running only ${relevantSteps.length} steps.\n_${analysis.reason}_` },
      ]);
    }

    // Listen to pipeline events — map stage to filtered step index
    const stageToFilteredIndex = new Map<number, number>();
    let filteredIdx = 0;
    ENGINE_LABELS.forEach((_, i) => {
      if (relevantSteps.includes(i)) {
        stageToFilteredIndex.set(i, filteredIdx++);
      }
    });

    const unsub = orchestrator.on((event) => {
      const rawIndex = STAGE_MAP[event.stage];
      // Find the closest filtered step
      if (rawIndex >= 0) {
        setProgress((prev) => {
          const mappedIdx = stageToFilteredIndex.get(rawIndex);
          if (mappedIdx !== undefined) {
            return prev.map((s, i) => ({
              ...s,
              status: i < mappedIdx ? "done" : i === mappedIdx ? "in_progress" : s.status === "done" ? "done" : "pending",
            }));
          }
          // If stage not in filtered, mark all before as done
          let closestIdx = -1;
          for (const [raw, filtered] of stageToFilteredIndex.entries()) {
            if (raw <= rawIndex) closestIdx = Math.max(closestIdx, filtered);
          }
          if (closestIdx >= 0) {
            return prev.map((s, i) => ({
              ...s,
              status: i <= closestIdx ? "done" : s.status,
            }));
          }
          return prev;
        });
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
            ...(i === current ? { errorDetail: event.message || "Unknown error" } : {}),
          }));
        });
      }
      // Capture agent completion data on done events
      if (event.stage !== "error" && event.stage !== "complete" && event.agentData) {
        setProgress((prev) => {
          const activeIdx = prev.findIndex((s) => s.status === "in_progress");
          if (activeIdx >= 0 && event.agentData?.agent) {
            return prev.map((s, i) => i === activeIdx ? { ...s, agentData: event.agentData } : s);
          }
          return prev;
        });
      }
    });

    try {
      const startTime = Date.now();
      if (selectedThemeId) {
        const preset = getThemePreset(selectedThemeId);
        if (preset) orchestrator.setThemePreset(preset);
      }
      // Pass scope, stepsNeeded, and existing config to orchestrator
      const result = await orchestrator.execute(buildPrompt, analysis.scope, analysis.stepsNeeded, previousConfig);
      const duration = Date.now() - startTime;
      setPipelineState(result);

      // Auto-save preview config to localStorage AND database so Preview page works immediately
      // Guard: don't overwrite a good config with an empty quick-update config
      if (result.stage === "complete" && result.config && result.config.pages.length > 0) {
        try { localStorage.setItem("ai-builder-preview-config", JSON.stringify(result.config)); } catch {}
        // Also persist to published_previews so prop edits and build results are in the same place
        if (user) {
          (async () => {
            try {
              const { data: existing } = await supabase.from("published_previews").select("id").eq("user_id", user.id).maybeSingle();
              if (existing) {
                await supabase.from("published_previews").update({ config: result.config as any, project_title: result.config!.title || "Untitled", updated_at: new Date().toISOString() }).eq("id", existing.id);
              } else {
                await supabase.from("published_previews").insert({ user_id: user.id, config: result.config as any, project_title: result.config!.title || "Untitled" });
              }
            } catch {}
          })();
        }
      }

      if (result.stage === "complete" && result.config) {
        const config = result.config;
        const v = result.validation;
        const thinkDuration = Math.round(duration / 1000);
        const buildComps = config.pages.flatMap((p) => p.components.map((c) => c.type));

        setBuildActivities(prev => {
          const completed = prev.map(a => a.status === "in_progress" ? { ...a, status: "done" as const } : a);
          return [
            ...completed,
            {
              id: crypto.randomUUID(), title: `Created ${config.pages.length} pages`, description: `${buildComps.length} components total`,
              status: "done" as const, details: { type: "pages" as const, data: { pages: config.pages } },
            },
            ...(config.collections.length > 0 ? [{
              id: crypto.randomUUID(), title: `Designed ${config.collections.length} collections`, description: "Database schema generated",
              status: "done" as const, details: { type: "database" as const, data: { collections: config.collections } },
            }] : []),
            ...(v ? [{
              id: crypto.randomUUID(), title: `Security: ${v.score}/100`, description: v.errors.length ? `${v.errors.length} issues found` : "All clear",
              status: "done" as const, details: { type: "security" as const, data: v },
            }] : []),
            {
              id: crypto.randomUUID(), title: "Build complete!", description: `Built in ${thinkDuration}s`,
              status: "done" as const, details: { type: "summary" as const, data: { pages: config.pages.length, collections: config.collections.length, components: buildComps.length, duration: thinkDuration } },
            },
          ];
        });

        if (result.suggestions?.length) setAiSuggestions(result.suggestions);

        // Track build analytics + save project memory
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const allComponents = config.pages.flatMap((p) => p.components.map((c) => c.type));
            await supabase.from("build_analytics").insert({
              user_id: currentUser.id,
              prompt: buildPrompt,
              project_title: config.title || "Untitled",
              components_used: allComponents,
              component_count: allComponents.length,
              page_count: config.pages.length,
              collection_count: config.collections.length,
              security_score: v?.score || (result.qualityScore?.overall_score || 0),
              status: "success",
              duration_ms: duration,
            });

            const activeProject = currentProjectRef.current;
            let projectId = activeProject?.id;
            if (activeProject) {
              // Only update title if the project doesn't already have one (first build)
              // Never overwrite the original prompt — it defines the project identity
              const updates: Record<string, any> = { status: "generated" };
              if (!activeProject.title || activeProject.title === "Untitled" || activeProject.title === "Quick Update") {
                updates.title = config.title || activeProject.title || "Untitled";
              }
              await supabase.from("projects").update(updates).eq("id", activeProject.id);
            } else {
              const { data: project } = await supabase.from("projects").insert({
                user_id: currentUser.id,
                prompt: originalPrompt || buildPrompt,
                title: config.title || "Untitled",
                status: "generated",
              }).select("*").single();
              if (project) {
                projectId = project.id;
                setCurrentProject(project);
                // Generate brand name + logo in background
                supabase.functions.invoke("generate-brand", {
                  body: { prompt: originalPrompt || buildPrompt, projectId: project.id },
                }).then(({ data: brandData }) => {
                  if (brandData?.success) {
                    setCurrentProject(prev => prev ? {
                      ...prev,
                      brand_name: brandData.brandName,
                      logo_url: brandData.logoUrl,
                    } : prev);
                  }
                }).catch(() => {});
              }
            }

            if (projectId) {
              await supabase.from("project_memory").upsert({
                user_id: currentUser.id,
                project_id: projectId,
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
              } as any, { onConflict: "project_id" });
            }
          }
        } catch {}

        // Build summary
        const thinkingTime = Math.round(duration / 1000);
        const allComps = config.pages.flatMap((p) => p.components.map((c) => c.type));
        const buildTasks: BuildTask[] = [
          { label: `Analyzed requirements & planned architecture`, status: "done" },
          ...(config.pages.length > 0 ? [{ label: `Created ${config.pages.length} pages with ${allComps.length} components`, status: "done" as const }] : []),
          ...(config.collections.length > 0 ? [{ label: `Designed ${config.collections.length} database collections`, status: "done" as const }] : []),
          ...(config.roles && config.roles.length > 0 ? [{ label: `Set up ${config.roles.length} user roles with RBAC`, status: "done" as const }] : []),
          ...(v ? [{ label: `Security validation: ${v.score}/100`, status: "done" as const }] : []),
          { label: `Generated complete app configuration`, status: "done" },
        ];
        const editedFiles = [
          "AppConfig.json",
          ...(config.collections.length > 0 ? ["DatabaseSchema.sql"] : []),
          ...config.pages.map(p => `${p.name}Page.tsx`),
        ];

        const summary = [
          `## ✅ ${config.title}`,
          `**${config.project_type}** · **${config.build_target}** · ${config.modules.join(", ")}`,
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
        ].filter(Boolean).join("\n");

        // Check if there are more phases
        const nextPhaseIndex = currentPhaseIndex + 1;
        const hasMorePhases = phasePlan.length > 0 && nextPhaseIndex < phasePlan.length;

        if (hasMorePhases) {
          const nextPhase = phasePlan[nextPhaseIndex];
          const phaseMsg = [
            summary,
            "",
            `---`,
            "",
            `✅ **Phase ${phasePlan[currentPhaseIndex]?.phase || currentPhaseIndex + 1} complete!** Check the **Preview** tab to see the progress.`,
            "",
            `🎯 **Next up — Phase ${nextPhase.phase}: ${nextPhase.title}**`,
            `_${nextPhase.description}_`,
            "",
            `Ready to continue? Type **"go"** or **"next"** to start Phase ${nextPhase.phase}, or tell me what you'd like to change first!`,
          ].join("\n");

          setCurrentPhaseIndex(nextPhaseIndex);
          setAwaitingPhaseConfirm(true);

          setMessages((prev) => {
            const updated = [...prev, { role: "ai" as const, content: phaseMsg, thinkingTime, tasks: buildTasks, editedFiles }];
            if (currentProject?.id && user) {
              supabase.from("project_memory").upsert({
                user_id: user.id,
                project_id: currentProject.id,
                agent_log: [{ type: "conversation", messages: updated }, { type: "phases", phasePlan, currentPhaseIndex: nextPhaseIndex }],
                status: "in_progress",
              } as any, { onConflict: "project_id" }).then(() => {});
            }
            return updated;
          });
        } else {
          // All phases complete or no phases
          const isLastPhase = phasePlan.length > 0 && nextPhaseIndex >= phasePlan.length;
          const completionMsg = isLastPhase
            ? `${summary}\n\n---\n\n🎉 **All ${phasePlan.length} phases are complete!** Your full application is ready.\n\nCheck the **Preview** tab to see everything, or tell me if you'd like any adjustments!`
            : `${summary}\n\nYour app is ready! Check the **Preview** tab to see it.`;

          // Reset phase state
          if (isLastPhase) {
            setPhasePlan([]);
            setCurrentPhaseIndex(0);
            setOriginalPrompt("");
          }

          setMessages((prev) => {
            const updated = [...prev, { role: "ai" as const, content: completionMsg, thinkingTime, tasks: buildTasks, editedFiles }];
            if (currentProject?.id && user) {
              supabase.from("project_memory").upsert({
                user_id: user.id,
                project_id: currentProject.id,
                agent_log: [{ type: "conversation", messages: updated }],
                status: "complete",
              } as any, { onConflict: "project_id" }).then(() => {});
            }
            return updated;
          });
        }
      } else if (result.error) {
        // Restore previous preview config if build failed
        if (previousConfig) {
          setPipelineState(prev => prev ? prev : {
            stage: "complete", config: previousConfig, validation: null, schema: null, rbac: null,
            testSuite: null, docs: null, theme: null, error: null,
            requirements: [], taskPlan: [], suggestions: [], apiEndpoints: [],
            qualityScore: {}, qualityIssues: [], qualityImprovements: [],
            qualityVerdict: "", agentLog: [], workflows: [], businessRules: [],
            permissionMatrix: [], folderStructure: {}, testScenarios: [], seedData: [],
            bugs: [], autoFixes: [], riskScore: 0, webhooks: [], edgeFunctions: [],
            errorFixMemory: [], documentationPlan: [], documentationChecklist: {},
            securityChecklist: {}, defaultAdminCredentials: { email: "admin@admin.com", password: "admin123" },
            installerSteps: [], pluginHooks: [], middlewareStack: [], reusableComponents: [], prismaSchemaHint: "",
          });
        }
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            await supabase.from("build_analytics").insert({
              user_id: currentUser.id, prompt: buildPrompt, status: "error", duration_ms: Date.now() - startTime,
            });
          }
        } catch {}
        setMessages((prev) => [...prev, { role: "ai", content: `Something went wrong: ${result.error}\n\nTry describing your app differently.` }]);
        toast({ title: "Build failed", description: result.error, variant: "destructive" });
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "ai", content: `Something went wrong: ${err.message}` }]);
    } finally {
      unsub();
      setIsBuilding(false);
      if (buildTimerRef.current) {
        clearInterval(buildTimerRef.current);
        buildTimerRef.current = null;
      }
    }
  };

  const handlePublish = async () => {
    if (pipelineState?.config) {
      localStorage.setItem("ai-builder-preview-config", JSON.stringify(pipelineState.config));
      // Also persist to database for published URL access
      if (user) {
        try {
          const { data: existing } = await supabase
            .from("published_previews")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (existing) {
            await supabase.from("published_previews").update({
              config: pipelineState.config as any,
              project_title: pipelineState.config.title || "Untitled",
              updated_at: new Date().toISOString(),
            }).eq("id", existing.id);
          } else {
            await supabase.from("published_previews").insert({
              user_id: user.id,
              config: pipelineState.config as any,
              project_title: pipelineState.config.title || "Untitled",
            });
          }
        } catch (err) {
          console.error("Failed to persist preview config:", err);
        }
      }
    }
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
    // Auto-persist to localStorage immediately
    try { localStorage.setItem("ai-builder-preview-config", JSON.stringify(config)); } catch {}
    // Debounced persist to database
    if (user) {
      clearTimeout((window as any).__propUpdateTimer);
      (window as any).__propUpdateTimer = setTimeout(async () => {
        try {
          const { data: existing } = await supabase.from("published_previews").select("id").eq("user_id", user.id).maybeSingle();
          if (existing) {
            await supabase.from("published_previews").update({ config: config as any, updated_at: new Date().toISOString() }).eq("id", existing.id);
          } else {
            await supabase.from("published_previews").insert({ user_id: user.id, config: config as any, project_title: config.title || "Untitled" });
          }
        } catch {}
      }, 2000);
    }
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
      // Generate real code files locally using the code generator engine
      const sql = pipelineState.schema?.sql || "";
      const project = generateProjectCode(pipelineState.config, sql);
      // Map engine GeneratedFile to CodePanel GeneratedFile format
      const mappedFiles: GeneratedFile[] = project.files.map(f => ({
        filename: f.path,
        pageName: f.path.split("/").pop()?.replace(/\.\w+$/, "") || f.path,
        route: f.path,
        code: f.content,
        isTemplate: false,
      }));
      setGeneratedFiles(mappedFiles);
      setActiveTab("code");
      toast({
        title: "Code generated!",
        description: `${project.summary.total_files} files: ${project.summary.frontend_files} frontend, ${project.summary.backend_files} backend, ${project.summary.config_files} config`,
      });
    } catch (err: any) {
      // Fallback to edge function
      try {
        const { data, error } = await supabase.functions.invoke("generate-code", {
          body: { config: pipelineState.config },
        });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Code generation failed");
        setGeneratedFiles(data.files || []);
        setActiveTab("code");
        toast({ title: "Code generated!", description: `${data.files?.length || 0} files created.` });
      } catch (fallbackErr: any) {
        toast({ title: "Code generation failed", description: fallbackErr.message, variant: "destructive" });
      }
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!pipelineState?.config) return;
    try {
      const sql = pipelineState.schema?.sql || "";
      const project = generateProjectCode(pipelineState.config, sql);
      const zip = new JSZip();
      for (const file of project.files) {
        zip.file(file.path, file.content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pipelineState.config.title.toLowerCase().replace(/\s+/g, "-")}-project.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "📦 ZIP downloaded!", description: `${project.summary.total_files} files exported.` });
    } catch (err: any) {
      toast({ title: "ZIP export failed", description: err.message, variant: "destructive" });
    }
  };

  const handleApplyAutoFixes = async () => {
    if (!pipelineState?.config) return;
    const fixes = pipelineState.autoFixes || [];
    const errorMemory = pipelineState.errorFixMemory || [];
    const allFixes = [...fixes, ...errorMemory];
    if (allFixes.length === 0) {
      toast({ title: "No fixes to apply", description: "No error patterns found in memory." });
      return;
    }
    const fixPrompt = `Apply these auto-fixes to "${pipelineState.config.title}":\n${allFixes.map((f: any, i: number) => `${i + 1}. ${f.fix_applied || f.fix || f.description || "Fix error"}`).join("\n")}\n\nRebuild with all fixes applied.`;
    await sendMessage(fixPrompt);
  };

  const handleUseTemplate = (template: StarterTemplate) => {
    const config = template.config;
    // Build a synthetic pipeline state from the template
    const templateState: PipelineState = {
      stage: "complete", config, validation: null, schema: null, rbac: null,
      testSuite: null, docs: null, theme: null, error: null,
      requirements: [config.description], taskPlan: [], suggestions: [],
      apiEndpoints: [], qualityScore: { overall_score: 85 }, qualityIssues: [],
      qualityImprovements: [], qualityVerdict: "Template-based build", agentLog: [],
      workflows: [], businessRules: [], permissionMatrix: [],
      folderStructure: {}, testScenarios: [], seedData: [],
      bugs: [], autoFixes: [], riskScore: 0, webhooks: [], edgeFunctions: [],
      errorFixMemory: [], documentationPlan: ["README.md", "INSTALL.md", "API.md", "DB_SCHEMA.md"],
      documentationChecklist: {}, securityChecklist: {},
      defaultAdminCredentials: { email: "admin@admin.com", password: "admin123" },
      installerSteps: [], pluginHooks: [], middlewareStack: [], reusableComponents: [], prismaSchemaHint: "",
    };
    setPipelineState(templateState);
    setMessages([
      { role: "ai", content: `🎯 **${template.name}** template loaded!\n\n${template.description}\n\n📄 ${config.pages.length} pages · 🗄 ${config.collections.length} collections · 👥 ${config.roles?.length || 0} roles\n\nYou can now:\n- **Preview** the app in the Preview tab\n- **Generate Code** to get the full source files\n- **Customize** by telling me what to change\n\n_Try: "Add a wishlist page" or "Change the color to blue"_` },
    ]);
    setActiveTab("preview");
    toast({ title: `${template.name} loaded!`, description: "Template ready — customize or generate code." });
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
        project_type: "saas", build_target: "application", title: currentProject?.title || "Restored Project", description: currentProject?.prompt || "Loaded from project memory",
        modules: memory.modules || [], roles: [], features: [],
        pages: memory.page_layouts || [], collections: memory.db_schema || [],
        style: {}, multi_tenant: false,
      };
    }
    // Prefer published_previews config if it has prop customizations
    try {
      const stored = localStorage.getItem("ai-builder-preview-config");
      if (stored) {
        const localConfig = JSON.parse(stored);
        if (localConfig?.pages?.length > 0 && restored.config && localConfig.title === restored.config.title) {
          restored.config = localConfig;
        }
      }
    } catch {}
    setPipelineState(restored);
    setActiveTab("preview");
  };

  const handleRestoreSnapshot = (snapshot: any) => {
    toast({ title: "Version selected", description: `"${snapshot.project_title}" — ${snapshot.page_count || 0} pages. Use Build History to fully reload.` });
  };

  const handleSelectProject = async (project: { id: string; title: string | null; prompt: string; status: string; created_at: string; updated_at: string } | null) => {
    setCurrentProject(project);
    if (project) {
      // Load project memory if exists
      try {
        const { data: memory } = await supabase
          .from("project_memory")
          .select("*")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (memory) {
          handleLoadProjectMemory(memory);
          // Restore saved conversations from agent_log
          const agentLog = memory.agent_log as any[] || [];
          const convEntry = agentLog.find((e: any) => e?.type === "conversation");
          if (convEntry?.messages?.length) {
            setMessages(convEntry.messages);
          } else {
            setMessages([{ role: "ai", content: `📂 Loaded project **${project.title || "Untitled"}** with previous build data.` }]);
          }
        } else {
          setMessages([{ role: "ai", content: `📂 Selected project **${project.title || "Untitled"}**. Send a prompt to start building.` }]);
          setPipelineState(null);
        }
      } catch {
        setMessages([{ role: "ai", content: `📂 Selected project **${project.title || "Untitled"}**. Send a prompt to start building.` }]);
        setPipelineState(null);
      }
    } else {
      setMessages([]);
      setPipelineState(null);
    }
  };

  const handleCreateProject = async (title: string) => {
    if (!user) return;
    try {
      const { data: project } = await supabase.from("projects").insert({
        user_id: user.id,
        prompt: "",
        title,
        status: "draft",
      }).select("*").single();
      if (project) {
        setCurrentProject(project);
        setMessages([{ role: "ai", content: `📂 Created project **${title}**. Describe what you want to build!` }]);
        setPipelineState(null);
        toast({ title: "Project created", description: title });
      }
    } catch {
      toast({ title: "Failed to create project", variant: "destructive" });
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const prompt = `Replicate the UI layout from the uploaded screenshot "${file.name}". Create a similar design with matching structure, spacing, and component layout. Use modern React components.`;
    sendMessage(prompt);
  };

  const handleForkProject = async (title: string, fromProjectId: string) => {
    if (!user) return;
    try {
      // Get source project memory
      const { data: memory } = await supabase
        .from("project_memory")
        .select("*")
        .eq("project_id", fromProjectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Create forked project
      const { data: project } = await supabase.from("projects").insert({
        user_id: user.id,
        prompt: memory?.requirements ? JSON.stringify(memory.requirements) : "",
        title,
        status: "draft",
      }).select("*").single();

      if (project && memory) {
        await supabase.from("project_memory").insert({
          user_id: user.id,
          project_id: project.id,
          requirements: memory.requirements,
          modules: memory.modules,
          db_schema: memory.db_schema,
          api_list: memory.api_list,
          ui_components: memory.ui_components,
          page_layouts: memory.page_layouts,
          task_plan: memory.task_plan,
          quality_score: memory.quality_score,
          suggestions: memory.suggestions,
          agent_log: memory.agent_log,
          folder_structure: memory.folder_structure,
          status: "forked",
        } as any);
      }

      toast({ title: "Project forked!", description: title });
    } catch {
      toast({ title: "Fork failed", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;
    try {
      await supabase.from("project_memory").delete().eq("project_id", projectId);
      await supabase.from("projects").delete().eq("id", projectId).eq("user_id", user.id);
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setPipelineState(null);
        setMessages([]);
        try { localStorage.removeItem("ai-builder-active-project-id"); } catch {}
      }
      toast({ title: "Project deleted" });
    } catch {
      toast({ title: "Failed to delete project", variant: "destructive" });
    }
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

    const activeSteps = progress.filter(s => s.status !== "done" || progress.indexOf(s) === progress.length - 1);
    const totalActive = progress.filter(s => s.status === "pending" || s.status === "in_progress" || s.status === "error").length;
    const doneCount = progress.filter(s => s.status === "done").length;
    const currentStep = progress.findIndex(s => s.status === "in_progress");
    const hasError = progress.some(s => s.status === "error");
    const relevantTotal = totalActive + doneCount;
    const percent = Math.round((doneCount / relevantTotal) * 100);
    const friendlyMsg = hasError
      ? "Something went wrong..."
      : currentStep >= 0
        ? FRIENDLY_LABELS[currentStep] || "Processing..."
        : doneCount === progress.length
          ? "Your app is ready!"
          : "Getting started...";

    return (
      <div className="mx-4 mb-3">
        {/* Thinking timer */}
        {buildElapsed > 0 && (
          <p className="text-[11px] text-muted-foreground mb-1.5 ml-10">Thought for {buildElapsed}s</p>
        )}
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
                <button
                  key={i}
                  onClick={() => setSelectedStepIndex(selectedStepIndex === i ? null : i)}
                  className={cn(
                    "w-full flex items-center gap-2 px-1.5 py-1 rounded-md transition-all text-left",
                    selectedStepIndex === i ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/40",
                    (step.status === "done" || step.status === "error") && "cursor-pointer"
                  )}
                >
                  {step.status === "done" ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> :
                   step.status === "in_progress" ? <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" /> :
                   step.status === "error" ? <AlertCircle className="w-3 h-3 text-destructive shrink-0" /> :
                   <Circle className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
                  <span className={cn(
                    "text-[11px] flex-1",
                    step.status === "done" ? "text-muted-foreground" :
                    step.status === "in_progress" ? "text-foreground font-medium" :
                    step.status === "error" ? "text-destructive" :
                    "text-muted-foreground/50"
                  )}>{step.label}</span>
                  {selectedStepIndex === i && <ChevronRight className="w-3 h-3 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Step detail panel (inline) */}
          {selectedStepIndex !== null && progress[selectedStepIndex] && (
            <div className="border-t border-border pt-3 mt-2 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground">{progress[selectedStepIndex].label}</h4>
                <button onClick={() => setSelectedStepIndex(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <Badge variant={progress[selectedStepIndex].status === "error" ? "destructive" : progress[selectedStepIndex].status === "done" ? "default" : "secondary"} className="text-[10px] capitalize">
                {progress[selectedStepIndex].status}
              </Badge>
              {progress[selectedStepIndex].errorDetail && (
                <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2.5 space-y-1">
                  <p className="text-[10px] font-semibold text-destructive uppercase">Error Detail</p>
                  <p className="text-xs text-destructive/90 break-words font-mono">{progress[selectedStepIndex].errorDetail}</p>
                </div>
              )}
              {progress[selectedStepIndex].agentData && (
                <div className="rounded-lg bg-muted/50 border border-border p-2.5 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Agent Output</p>
                  <pre className="text-[10px] font-mono text-foreground overflow-auto max-h-40 whitespace-pre-wrap break-words">
                    {JSON.stringify(progress[selectedStepIndex].agentData, null, 2).slice(0, 1000)}
                  </pre>
                </div>
              )}
              {!progress[selectedStepIndex].errorDetail && !progress[selectedStepIndex].agentData && (
                <p className="text-xs text-muted-foreground">
                  {progress[selectedStepIndex].status === "pending" ? "Waiting to start..." :
                   progress[selectedStepIndex].status === "in_progress" ? "Currently processing..." :
                   "No additional details available."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // === Welcome screen (Lovable-style) ===
  const renderWelcome = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-24 sm:pb-32">
      <div className="max-w-2xl w-full text-center space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            What do you want to build?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Describe your app and AI will generate everything — pages, database, auth, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
          {suggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => sendMessage(s.prompt)}
              className="group flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card text-left hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.prompt}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Build Target Guide */}
        <BuildTargetGuide />

        {/* Template Library */}
        <div className="mt-8 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Or start from a template
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STARTER_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleUseTemplate(t)}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card text-center hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{t.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // === Chat messages ===
  const renderMessages = () => (
    <ScrollArea className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="animate-fade-in">
            {/* Thinking time indicator */}
            {msg.role === "ai" && msg.thinkingTime && msg.thinkingTime > 0 && (
              <p className="text-[11px] text-muted-foreground mb-1.5 ml-10">Thought for {msg.thinkingTime}s</p>
            )}

            <div className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] text-sm space-y-2",
              )}>
                {/* Main message content */}
                <div className={cn(
                  "rounded-2xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                )}>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h2]:text-base [&_h2]:font-semibold [&_p]:leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>

                {/* Task completion card (Lovable-style) */}
                {msg.role === "ai" && msg.tasks && msg.tasks.length > 0 && (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {/* Edited files header */}
                    {msg.editedFiles && msg.editedFiles.length > 0 && (
                      <div className="px-3 py-2 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileCode2 className="w-3 h-3" />
                          <span className="font-medium">Edited</span>
                          <div className="flex gap-1 flex-wrap">
                            {msg.editedFiles.map((file, fi) => (
                              <Badge key={fi} variant="secondary" className="text-[10px] h-4 font-mono">
                                {file}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Task list */}
                    <div className="px-3 py-2 space-y-1">
                      {msg.tasks.map((task, ti) => (
                        <div key={ti} className="flex items-center gap-2">
                          <CheckCircle2 className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            task.status === "done" ? "text-primary" : "text-muted-foreground/30"
                          )} />
                          <span className={cn(
                            "text-xs",
                            task.status === "done" ? "text-foreground" : "text-muted-foreground"
                          )}>{task.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

        {/* Phase action buttons */}
        {awaitingPhaseConfirm && !isBuilding && phasePlan.length > 0 && currentPhaseIndex < phasePlan.length && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Rocket className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => sendMessage("Let's go!")}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Start Phase {phasePlan[currentPhaseIndex].phase}
              </button>
              <button
                onClick={() => {
                  setAwaitingPhaseConfirm(false);
                  setPhasePlan([]);
                  setCurrentPhaseIndex(0);
                  setMessages((prev) => [...prev, { role: "ai", content: "No problem! Feel free to tell me what you'd like to do instead, or describe your project differently." }]);
                }}
                className="px-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground hover:bg-accent transition-all"
              >
                Skip phases, build all at once
              </button>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </ScrollArea>
  );

  const CONTENT_TYPES = [
    { value: "website", label: "🌐 Website", icon: Globe },
    { value: "application", label: "📱 Application", icon: LayoutGrid },
    { value: "plugin", label: "🧩 Plugin", icon: Package },
    { value: "website+application", label: "🌐+📱 Website + App", icon: Layers },
    { value: "application+plugin", label: "📱+🧩 App + Plugin", icon: Layers },
    { value: "full", label: "🌐+📱+🧩 Full Stack", icon: Layers },
  ];

  const COLOR_PRESETS = [
    { name: "Blue", color: "hsl(221, 83%, 53%)" },
    { name: "Purple", color: "hsl(271, 76%, 53%)" },
    { name: "Green", color: "hsl(142, 71%, 45%)" },
    { name: "Orange", color: "hsl(24, 95%, 53%)" },
    { name: "Rose", color: "hsl(346, 77%, 50%)" },
    { name: "Cyan", color: "hsl(189, 94%, 43%)" },
  ];

  const handleMicToggle = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        toast({ title: "🎤 Transcribing...", description: "Converting your voice to text..." });
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          const { data, error } = await supabase.functions.invoke("speech-to-text", {
            body: formData,
          });
          if (error) throw error;
          if (data?.transcript?.trim()) {
            setInput((prev) => (prev ? prev + " " : "") + data.transcript.trim());
            toast({ title: "🎤 Transcribed!", description: data.transcript.trim().slice(0, 60) + "..." });
          } else {
            toast({ title: "No speech detected", description: "Try speaking more clearly.", variant: "destructive" });
          }
        } catch (err: any) {
          console.error("Transcription error:", err);
          toast({ title: "Transcription failed", description: err.message || "Please try again.", variant: "destructive" });
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "🎤 Recording...", description: "Click mic again to stop." });
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const renderChatInput = () => (
    <div className="border-t border-border bg-card p-2 sm:p-3 shrink-0">
      <div className="max-w-3xl mx-auto space-y-0">
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

        {/* Lovable-style single input container */}
        <div className="rounded-2xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all overflow-hidden">
          {/* Textarea area */}
          <div className="px-3 pt-3 pb-1">
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
              placeholder={isBuilding ? "Queue another prompt..." : `Describe your ${selectedContentType}...`}
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[36px] max-h-[300px]"
            />
          </div>

          {/* Bottom toolbar inside the container */}
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            {/* Left side tools */}
            <div className="flex items-center gap-0.5">
              {/* Plus dropdown: Attachment + URL */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                    title="Add"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[180px]">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowUrlInput(!showUrlInput)} className="gap-2">
                    <Link2 className="w-4 h-4" />
                    Website URL
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mic button */}
              <Button
                variant="ghost" size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-colors",
                  isRecording ? "text-destructive bg-destructive/10 hover:bg-destructive/20" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={handleMicToggle}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>

              {/* Divider */}
              <div className="w-px h-5 bg-border mx-1" />

              {/* Content Type Selector */}
              <div className="relative">
                <button
                  onClick={() => { setShowContentType(!showContentType); setShowColorPresets(false); }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {CONTENT_TYPES.find(c => c.value === selectedContentType)?.label || "🌐 Website"}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showContentType && (
                  <div className="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded-lg shadow-lg p-1 z-50 min-w-[180px]">
                    {CONTENT_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        onClick={() => { setSelectedContentType(ct.value); setShowContentType(false); }}
                        className={cn(
                          "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs text-left transition-colors",
                          selectedContentType === ct.value ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                        )}
                      >
                        <ct.icon className="w-3.5 h-3.5" />
                        {ct.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Presets */}
              <div className="relative">
                <button
                  onClick={() => { setShowColorPresets(!showColorPresets); setShowContentType(false); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Palette className="w-3 h-3" />
                  <span className="hidden sm:inline">Colors</span>
                </button>
                {showColorPresets && (
                  <div className="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded-lg shadow-lg p-2 z-50">
                    <div className="flex gap-1.5">
                      {COLOR_PRESETS.map((cp) => (
                        <button
                          key={cp.name}
                          onClick={() => {
                            setInput((prev) => prev + ` Use ${cp.name.toLowerCase()} as primary color.`);
                            setShowColorPresets(false);
                          }}
                          className="group flex flex-col items-center gap-1"
                          title={cp.name}
                        >
                          <div
                            className="w-6 h-6 rounded-full border-2 border-border group-hover:border-foreground/50 transition-colors"
                            style={{ backgroundColor: cp.color }}
                          />
                          <span className="text-[9px] text-muted-foreground">{cp.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: send button */}
            <Button
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg shrink-0 transition-all",
                input.trim() ? "opacity-100" : "opacity-50"
              )}
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
            >
              {isBuilding ? <Plus className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // === Chat Panel (Lovable-style) ===
  const selectedActivity = buildActivities.find(a => a.id === selectedActivityId) || null;

  const renderChat = () => (
    <div className="flex flex-col h-full bg-background">
      {isRestoring ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading project...</span>
          </div>
        </div>
      ) : hasStarted ? renderMessages() : renderWelcome()}
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
      <div className="flex flex-col h-full overflow-hidden">
        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {previewMode === "visual" ? (
            <div className="flex h-full min-h-0">
              <div className="flex-1 min-w-0 overflow-auto">
                <AppPreviewRenderer
                  config={config}
                  selectedComponent={selectedComponent}
                  onSelectComponent={(pi, ci) => setSelectedComponent({ pageIndex: pi, componentIndex: ci })}
                  onReorderComponents={handleReorderComponents}
                  onDeleteComponent={(pi, ci) => {
                    if (!pipelineState?.config) return;
                    const updated = { ...pipelineState };
                    const cfg = { ...updated.config! };
                    const pages = [...cfg.pages];
                    const page = { ...pages[pi] };
                    page.components = page.components.filter((_, idx) => idx !== ci);
                    pages[pi] = page;
                    cfg.pages = pages;
                    updated.config = cfg;
                    setPipelineState(updated);
                    setSelectedComponent(null);
                  }}
                  onAddComponent={(pi, type) => {
                    if (!pipelineState?.config) return;
                    const updated = { ...pipelineState };
                    const cfg = { ...updated.config! };
                    const pages = [...cfg.pages];
                    const page = { ...pages[pi] };
                    page.components = [...page.components, { type, props: {} }];
                    pages[pi] = page;
                    cfg.pages = pages;
                    updated.config = cfg;
                    setPipelineState(updated);
                  }}
                  onAddPage={(name, route, layout) => {
                    if (!pipelineState?.config) return;
                    const updated = { ...pipelineState };
                    const cfg = { ...updated.config! };
                    cfg.pages = [...cfg.pages, { name, route, layout: layout as any, components: [] }];
                    updated.config = cfg;
                    setPipelineState(updated);
                  }}
                  onDeletePage={(pi) => {
                    if (!pipelineState?.config || pipelineState.config.pages.length <= 1) return;
                    const updated = { ...pipelineState };
                    const cfg = { ...updated.config! };
                    cfg.pages = cfg.pages.filter((_, idx) => idx !== pi);
                    updated.config = cfg;
                    setPipelineState(updated);
                    setSelectedComponent(null);
                  }}
                  onUpdateComponentProp={(pi, ci, propKey, value) => {
                    if (!pipelineState?.config) return;
                    const updated = { ...pipelineState };
                    const cfg = { ...updated.config! };
                    const pages = [...cfg.pages];
                    const page = { ...pages[pi] };
                    const components = [...page.components];
                    components[ci] = { ...components[ci], props: { ...components[ci].props, [propKey]: value } };
                    page.components = components;
                    pages[pi] = page;
                    cfg.pages = pages;
                    updated.config = cfg;
                    setPipelineState(updated);
                  }}
                />
              </div>
              {selectedComponent && selectedComp && (
                <PropEditorSidebar
                  component={selectedComp}
                  componentIndex={selectedComponent.componentIndex}
                  pageIndex={selectedComponent.pageIndex}
                  config={config || undefined}
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

  // Mobile: default to chat tab
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  // Mobile: only override to "chat" if no build AND not currently restoring
  const effectiveTab = isMobile
    ? (activeTab === "preview" && !hasStarted && !isRestoring ? "chat" : activeTab)
    : activeTab;
  // Desktop right panel: if activeTab is "chat", show "preview"; if "activity-detail", show that
  const desktopRightTab = activeTab === "chat" ? (selectedActivityId ? "activity-detail" : "preview") : activeTab;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-2 sm:px-4 h-11 sm:h-12 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground hidden sm:inline">AI Builder</span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="min-w-0 flex-1 sm:flex-none">
              <ProjectSelector
                selectedProject={currentProject}
                onSelectProject={handleSelectProject}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
              />
            </div>
            {isBuilding && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 shrink-0">
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                <span className="text-[10px] sm:text-xs font-medium text-primary">Building...</span>
              </div>
            )}
            {buildComplete && !isBuilding && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                <span className="text-[10px] sm:text-xs font-medium text-primary hidden sm:inline">Ready</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="hidden sm:block">
              <ThemeSelector selectedTheme={selectedThemeId} onSelect={setSelectedThemeId} />
            </div>
            {buildComplete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hidden lg:flex">
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={async () => {
                    if (!pipelineState?.config) return;
                    try {
                      const { exportToHTML } = await import("@/lib/engine/html-exporter");
                      const result = await exportToHTML(pipelineState.config);
                      const url = URL.createObjectURL(result.blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = result.filename;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast({ title: "🌐 HTML Downloaded!", description: `${result.pageCount} page(s) exported. Password in editor.txt.` });
                    } catch (err: any) {
                      toast({ title: "Export failed", description: err.message, variant: "destructive" });
                    }
                  }}>
                    <Globe className="w-4 h-4 mr-2" /> HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadZip}>
                    <Code className="w-4 h-4 mr-2" /> React / Node.js
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <FileText className="w-4 h-4 mr-2" /> JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="ghost" size="sm"
              onClick={async () => {
                if (pipelineState?.config) {
                  localStorage.setItem("ai-builder-preview-config", JSON.stringify(pipelineState.config));
                  if (user) {
                    try {
                      const { data: existing } = await supabase.from("published_previews").select("id").eq("user_id", user.id).maybeSingle();
                      if (existing) {
                        await supabase.from("published_previews").update({ config: pipelineState.config as any, project_title: pipelineState.config.title || "Untitled", updated_at: new Date().toISOString() }).eq("id", existing.id);
                      } else {
                        await supabase.from("published_previews").insert({ user_id: user.id, config: pipelineState.config as any, project_title: pipelineState.config.title || "Untitled" });
                      }
                    } catch {}
                  }
                  window.open("/preview", "_blank");
                }
              }}
              disabled={!buildComplete}
              className="gap-1 text-xs h-7 sm:h-8 px-2 text-muted-foreground hover:text-foreground"
              title="Open preview in new tab"
            >
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">New Tab</span>
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={!buildComplete} className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <Rocket className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Publish</span>
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
                  <div className="border-b border-border bg-card overflow-hidden">
                    <Tabs value={desktopRightTab} onValueChange={setActiveTab}>
                      <div className="overflow-x-auto scrollbar-hide">
                        <TabsList className="bg-transparent h-11 p-0 gap-0 w-max min-w-full px-4">
                          {/* Essential tabs only */}
                          <TabsTrigger value="preview" className={tabTriggerClass}>
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </TabsTrigger>
                          <TabsTrigger value="code" className={tabTriggerClass}>
                            <FileCode2 className="w-3.5 h-3.5" /> Code
                            {generatedFiles.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 ml-1">{generatedFiles.length}</Badge>}
                          </TabsTrigger>
                          <TabsTrigger value="deploy" className={tabTriggerClass}>
                            <Rocket className="w-3.5 h-3.5" /> Deploy
                          </TabsTrigger>
                          <TabsTrigger value="db-designer" className={tabTriggerClass}>
                            <Database className="w-3.5 h-3.5" /> Database
                          </TabsTrigger>
                          <TabsTrigger value="quality" className={tabTriggerClass}>
                            <TrendingUp className="w-3.5 h-3.5" /> Quality
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </Tabs>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    {desktopRightTab === "activity-detail" && selectedActivity ? (
                      <ActivityDetailView activity={selectedActivity} />
                    ) : null}
                    {desktopRightTab === "preview" && renderPreview()}
                    {desktopRightTab === "builder" && (
                      <DragDropBuilderPanel
                        config={pipelineState?.config || null}
                        onConfigUpdate={(newConfig) => {
                          if (!pipelineState) return;
                          setPipelineState({ ...pipelineState, config: newConfig });
                        }}
                        selectedComponent={selectedComponent}
                        onSelectComponent={(pi, ci) => setSelectedComponent({ pageIndex: pi, componentIndex: ci })}
                        onClearSelection={() => setSelectedComponent(null)}
                        onPropUpdate={handlePropUpdate}
                      />
                    )}
                    {desktopRightTab === "db-designer" && (
                      <DatabaseDesignerPanel
                        config={pipelineState?.config || null}
                        onConfigUpdate={(newConfig) => {
                          if (!pipelineState) return;
                          setPipelineState({ ...pipelineState, config: newConfig });
                        }}
                      />
                    )}
                    {desktopRightTab === "config" && renderConfig()}
                    {desktopRightTab === "sql" && renderSQL()}
                    {desktopRightTab === "security" && (
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
                    {desktopRightTab === "quality" && (
                      <QualityScorePanel
                        pipelineState={pipelineState}
                        onAutoImprove={handleAutoImprove}
                        isImproving={isAutoImproving}
                      />
                    )}
                    {desktopRightTab === "deploy" && (
                      <DeployPanel
                        config={pipelineState?.config || null}
                        sql={pipelineState?.schema?.sql}
                        onExportJSON={handleExportJSON}
                        onExportSQL={handleExportSQL}
                      />
                    )}
                    {desktopRightTab === "summary" && (
                      <BuildSummaryPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "code" && (
                      <CodePanel
                        files={generatedFiles}
                        isGenerating={isGeneratingCode}
                        onGenerate={handleGenerateCode}
                        hasConfig={!!pipelineState?.config}
                      />
                    )}
                    {desktopRightTab === "live" && (
                      <LivePreviewPanel
                        files={generatedFiles}
                        isGenerating={isGeneratingCode}
                        onGenerate={handleGenerateCode}
                        hasConfig={!!pipelineState?.config}
                      />
                    )}
                    {desktopRightTab === "autofix" && (
                      <AutoFixLoopPanel
                        pipelineState={pipelineState}
                        onRetryBuild={() => pipelineState?.config && sendMessage(`Fix all issues and rebuild "${pipelineState.config.title}"`)}
                        onApplyFixes={handleApplyAutoFixes}
                        isBuilding={isBuilding}
                      />
                    )}
                    {desktopRightTab === "plugin" && (
                      <PluginGeneratorWizard
                        onGenerate={(plugin) => {
                          const prompt = `Generate a "${plugin.name}" plugin with entities: ${plugin.entities.map(e => e.name).join(", ")}. Include full CRUD, dashboard pages, permissions: ${plugin.permissions.join(", ")}. Slug: ${plugin.slug}`;
                          sendMessage(prompt);
                          toast({ title: "Plugin generation started!", description: `Building ${plugin.name} plugin...` });
                        }}
                      />
                    )}
                    {desktopRightTab === "workflow" && (
                      <WorkflowApiPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "installer" && (
                      <InstallerArchitecturePanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "history" && (
                      <ProjectHistoryPanel onLoadProject={handleLoadProjectMemory} />
                    )}
                    {desktopRightTab === "timemachine" && (
                      <TimeMachinePanel onRestoreSnapshot={handleRestoreSnapshot} />
                    )}
                    {desktopRightTab === "docs" && (
                      <DocsGeneratorPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "cicd" && (
                      <CICDExportPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "collab" && (
                      <CollaborationPanel pipelineState={pipelineState} isBuilding={isBuilding} projectId={currentProject?.id || null} />
                    )}
                    {desktopRightTab === "monitor" && (
                      <MonitoringPanel pipelineState={pipelineState} isBuilding={isBuilding} />
                    )}
                    {desktopRightTab === "envs" && (
                      <EnvironmentManagerPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "webhooks" && (
                      <WebhookNotificationPanel pipelineState={pipelineState} isBuilding={isBuilding} projectId={currentProject?.id || null} />
                    )}
                    {desktopRightTab === "branches" && (
                      <ProjectBranchingPanel
                        pipelineState={pipelineState}
                        currentProject={currentProject}
                        onForkProject={handleForkProject}
                      />
                    )}
                    {desktopRightTab === "i18n" && (
                      <I18nGeneratorPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "seo" && (
                      <SEOOptimizerPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "performance" && (
                      <PerformancePanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "mobile-export" && (
                      <MobileExportPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "payments" && (
                      <PaymentIntegrationPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "cron" && (
                      <CronJobPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "marketplace" && (
                      <ComponentMarketplacePanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "team" && (
                      <TeamWorkspacePanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "api-docs" && (
                      <ApiDocsGeneratorPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "automation" && (
                      <WorkflowAutomationPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "analytics" && (
                      <AdvancedAnalyticsPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "errors" && (
                      <ErrorBoundaryPanel pipelineState={pipelineState} />
                    )}
                    {desktopRightTab === "a11y" && (
                      <AccessibilityCheckerPanel pipelineState={pipelineState} />
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex flex-col h-full overflow-hidden">
            <div className="border-b border-border bg-card px-1 shrink-0">
              <div className="flex items-center h-10 w-full overflow-x-auto scrollbar-none">
                <Tabs value={effectiveTab} onValueChange={setActiveTab} className="flex-1 min-w-0">
                  <TabsList className="bg-transparent h-10 p-0 gap-0 justify-start inline-flex">
                     <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2.5 gap-1 text-[11px] shrink-0">
                      <Sparkles className="w-3 h-3" /> Chat
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2.5 gap-1 text-[11px] shrink-0">
                      <Eye className="w-3 h-3" /> Preview
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                {/* More dropdown + Theme — inline with tabs */}
                <div className="flex items-center gap-1 shrink-0 pr-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors shrink-0">
                        <Layers className="w-3 h-3" /> More
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[160px] max-h-[300px] overflow-y-auto">
                      {[
                        { value: "code", icon: FileCode2, label: "Code" },
                        { value: "deploy", icon: Rocket, label: "Deploy" },
                        { value: "db-designer", icon: Database, label: "Database" },
                        { value: "quality", icon: TrendingUp, label: "Quality" },
                      ].map((tab) => (
                        <DropdownMenuItem
                          key={tab.value}
                          onClick={() => setActiveTab(tab.value)}
                          className={cn("gap-2 text-xs", effectiveTab === tab.value && "bg-primary/10 text-primary")}
                        >
                          <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="sm:hidden shrink-0">
                    <ThemeSelector selectedTheme={selectedThemeId} onSelect={setSelectedThemeId} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {effectiveTab === "chat" && renderChat()}
              {effectiveTab === "preview" && renderPreview()}
              {effectiveTab === "builder" && (
                <DragDropBuilderPanel
                  config={pipelineState?.config || null}
                  onConfigUpdate={(newConfig) => {
                    if (!pipelineState) return;
                    setPipelineState({ ...pipelineState, config: newConfig });
                  }}
                  selectedComponent={selectedComponent}
                  onSelectComponent={(pi, ci) => setSelectedComponent({ pageIndex: pi, componentIndex: ci })}
                  onClearSelection={() => setSelectedComponent(null)}
                  onPropUpdate={handlePropUpdate}
                />
              )}
              {effectiveTab === "db-designer" && (
                <DatabaseDesignerPanel
                  config={pipelineState?.config || null}
                  onConfigUpdate={(newConfig) => {
                    if (!pipelineState) return;
                    setPipelineState({ ...pipelineState, config: newConfig });
                  }}
                />
              )}
              {effectiveTab === "config" && renderConfig()}
              {effectiveTab === "sql" && renderSQL()}
              {effectiveTab === "quality" && (
                <QualityScorePanel
                  pipelineState={pipelineState}
                  onAutoImprove={handleAutoImprove}
                  isImproving={isAutoImproving}
                />
              )}
              {effectiveTab === "deploy" && (
                <DeployPanel
                  config={pipelineState?.config || null}
                  onExportJSON={handleExportJSON}
                  onExportSQL={handleExportSQL}
                />
              )}
              {effectiveTab === "summary" && (
                <BuildSummaryPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "code" && (
                <CodePanel
                  files={generatedFiles}
                  isGenerating={isGeneratingCode}
                  onGenerate={handleGenerateCode}
                  hasConfig={!!pipelineState?.config}
                />
              )}
              {effectiveTab === "live" && (
                <LivePreviewPanel
                  files={generatedFiles}
                  isGenerating={isGeneratingCode}
                  onGenerate={handleGenerateCode}
                  hasConfig={!!pipelineState?.config}
                />
              )}
              {effectiveTab === "autofix" && (
                <AutoFixLoopPanel
                  pipelineState={pipelineState}
                  onRetryBuild={() => pipelineState?.config && sendMessage(`Fix all issues and rebuild "${pipelineState.config.title}"`)}
                  onApplyFixes={handleApplyAutoFixes}
                  isBuilding={isBuilding}
                />
              )}
              {effectiveTab === "plugin" && (
                <PluginGeneratorWizard
                  onGenerate={(plugin) => {
                    const prompt = `Generate a "${plugin.name}" plugin with entities: ${plugin.entities.map(e => e.name).join(", ")}. Include full CRUD, dashboard pages, permissions: ${plugin.permissions.join(", ")}. Slug: ${plugin.slug}`;
                    sendMessage(prompt);
                    toast({ title: "Plugin generation started!", description: `Building ${plugin.name} plugin...` });
                  }}
                />
              )}
              {effectiveTab === "workflow" && (
                <WorkflowApiPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "installer" && (
                <InstallerArchitecturePanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "history" && (
                <ProjectHistoryPanel onLoadProject={handleLoadProjectMemory} />
              )}
              {effectiveTab === "timemachine" && (
                <TimeMachinePanel onRestoreSnapshot={handleRestoreSnapshot} />
              )}
              {effectiveTab === "docs" && (
                <DocsGeneratorPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "cicd" && (
                <CICDExportPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "collab" && (
                <CollaborationPanel pipelineState={pipelineState} isBuilding={isBuilding} projectId={currentProject?.id || null} />
              )}
              {effectiveTab === "monitor" && (
                <MonitoringPanel pipelineState={pipelineState} isBuilding={isBuilding} />
              )}
              {effectiveTab === "envs" && (
                <EnvironmentManagerPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "webhooks" && (
                <WebhookNotificationPanel pipelineState={pipelineState} isBuilding={isBuilding} projectId={currentProject?.id || null} />
              )}
              {effectiveTab === "branches" && (
                <ProjectBranchingPanel
                  pipelineState={pipelineState}
                  currentProject={currentProject}
                  onForkProject={handleForkProject}
                />
              )}
              {effectiveTab === "i18n" && (
                <I18nGeneratorPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "seo" && (
                <SEOOptimizerPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "performance" && (
                <PerformancePanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "mobile-export" && (
                <MobileExportPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "payments" && (
                <PaymentIntegrationPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "cron" && (
                <CronJobPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "marketplace" && (
                <ComponentMarketplacePanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "team" && (
                <TeamWorkspacePanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "api-docs" && (
                <ApiDocsGeneratorPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "automation" && (
                <WorkflowAutomationPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "analytics" && (
                <AdvancedAnalyticsPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "errors" && (
                <ErrorBoundaryPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "a11y" && (
                <AccessibilityCheckerPanel pipelineState={pipelineState} />
              )}
              {effectiveTab === "activity-detail" && selectedActivity && (
                <ActivityDetailView activity={selectedActivity} />
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
