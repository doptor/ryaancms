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
  TrendingUp, Link2, X, Eye, ChevronDown, ChevronUp,
  ArrowUp, Plus, Layers, RefreshCw, Package,
  GitBranch, Settings, History, Book, Container,
  Users, Activity, FolderOpen, Server,
  Webhook, Bell as BellIcon, GitFork,
  Globe, Link, MicOff,
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getThemePreset } from "@/lib/engine/theme-generator";
import { analyzePrompt, ProjectPhase, BuildTarget } from "@/lib/engine/prompt-analyzer";

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
  const { user } = useAuth();
  const incomingPrompt = (location.state as any)?.prompt || "";
  const incomingProjectId = (location.state as any)?.projectId || null;
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
  const [selectedContentType, setSelectedContentType] = useState<string>("website");
  const [showColorPresets, setShowColorPresets] = useState(false);
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
    if (incomingPrompt && !hasProcessedIncoming.current && !isRestoring) {
      hasProcessedIncoming.current = true;
      // Clear location state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);
      setTimeout(() => sendMessage(incomingPrompt), 300);
    }
  }, [incomingPrompt, isRestoring]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  // Auto-restore last active project on mount (read-only, no creation)
  // Load project from navigation state (clicked from dashboard)
  useEffect(() => {
    if (!user || !incomingProjectId) return;
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
          // Load memory
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
      await supabase.from("project_memory").upsert({
        user_id: user.id,
        project_id: currentProject.id,
        agent_log: [{ type: "conversation", messages: msgs }],
        status: pipelineState?.stage === "complete" ? "complete" : "in_progress",
      } as any, { onConflict: "project_id" });
    } catch {}
  }, [currentProject?.id, user, pipelineState?.stage]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isBuilding) return;

    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    // Auto-save conversation after every user message
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
      // Small delay for UX
      await new Promise(r => setTimeout(r, 500));
      await executeBuild(phase.prompt);
      return;
    }

    // Smart step detection
    const analysis = analyzePrompt(text);

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
    setPipelineState(null);

    const analysis = analyzePrompt(buildPrompt);
    const relevantSteps = analysis.stepsNeeded;
    // Only show relevant steps — don't expose all 17 to users
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
          }));
        });
      }
    });

    try {
      const startTime = Date.now();
      if (selectedThemeId) {
        const preset = getThemePreset(selectedThemeId);
        if (preset) orchestrator.setThemePreset(preset);
      }
      // Pass scope and stepsNeeded to orchestrator
      const result = await orchestrator.execute(buildPrompt, analysis.scope, analysis.stepsNeeded);
      const duration = Date.now() - startTime;
      setPipelineState(result);

      if (result.stage === "complete" && result.config) {
        const config = result.config;
        const v = result.validation;

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
              await supabase.from("projects").update({
                prompt: originalPrompt || buildPrompt,
                title: config.title || activeProject.title || "Untitled",
                status: "generated",
              }).eq("id", activeProject.id);
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
              await supabase.from("project_memory").insert({
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
              } as any);
            }
          }
        } catch {}

        // Build summary
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
            const updated = [...prev, { role: "ai" as const, content: phaseMsg }];
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
            const updated = [...prev, { role: "ai" as const, content: completionMsg }];
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
        project_type: "saas", build_target: "application", title: currentProject?.title || "Restored Project", description: currentProject?.prompt || "Loaded from project memory",
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
      <div className="max-w-3xl mx-auto space-y-1.5 sm:space-y-2">
        {/* Top toolbar: content type + color presets */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Content Type Selector */}
          <div className="relative">
            <button
              onClick={() => { setShowContentType(!showContentType); setShowColorPresets(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <Palette className="w-3 h-3" /> Colors
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

        {/* URL input for replication */}
        {showUrlInput && (
          <div className="flex items-center gap-2">
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
            placeholder={isBuilding ? "Building your app..." : `Describe your ${selectedContentType}...`}
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

  // Mobile: default to chat tab
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  // Mobile: only override to "chat" if no build AND not currently restoring
  const effectiveTab = isMobile
    ? (activeTab === "preview" && !hasStarted && !isRestoring ? "chat" : activeTab)
    : activeTab;
  // Desktop right panel: if activeTab is "chat", show "preview" instead (chat is always visible on left)
  const desktopRightTab = activeTab === "chat" ? "preview" : activeTab;

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
              <Button variant="ghost" size="sm" onClick={handleExportJSON} className="gap-1.5 text-xs text-muted-foreground hidden lg:flex">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            )}
            <Button
              variant="ghost" size="sm"
              onClick={() => {
                if (pipelineState?.config) {
                  localStorage.setItem("ai-builder-preview-config", JSON.stringify(pipelineState.config));
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
                  <div className="border-b border-border bg-card px-4">
                    <Tabs value={desktopRightTab} onValueChange={setActiveTab}>
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
                        <TabsTrigger value="envs" className={tabTriggerClass}>
                          <Server className="w-3.5 h-3.5" /> Envs
                        </TabsTrigger>
                        <TabsTrigger value="webhooks" className={tabTriggerClass}>
                          <Webhook className="w-3.5 h-3.5" /> Hooks
                        </TabsTrigger>
                        <TabsTrigger value="branches" className={tabTriggerClass}>
                          <GitFork className="w-3.5 h-3.5" /> Branch
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    {desktopRightTab === "preview" && renderPreview()}
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
                        { value: "quality", icon: TrendingUp, label: "Quality" },
                        { value: "config", icon: Code, label: "Config" },
                        { value: "security", icon: Shield, label: "Security" },
                        { value: "summary", icon: Layers, label: "Summary" },
                        { value: "live", icon: Eye, label: "Live" },
                        { value: "autofix", icon: RefreshCw, label: "Auto-Fix" },
                        { value: "plugin", icon: Package, label: "Plugin" },
                        { value: "workflow", icon: GitBranch, label: "Workflow" },
                        { value: "installer", icon: Settings, label: "Installer" },
                        { value: "history", icon: History, label: "History" },
                        { value: "timemachine", icon: Clock, label: "Versions" },
                        { value: "docs", icon: Book, label: "Docs" },
                        { value: "cicd", icon: Container, label: "CI/CD" },
                        { value: "collab", icon: Users, label: "Team" },
                        { value: "monitor", icon: Activity, label: "Monitor" },
                        { value: "envs", icon: Server, label: "Envs" },
                        { value: "webhooks", icon: Webhook, label: "Hooks" },
                        { value: "branches", icon: GitFork, label: "Branch" },
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
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
