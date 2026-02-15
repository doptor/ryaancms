import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, CheckCircle2, XCircle, ExternalLink, Info, Copy, Check, Plug, Loader2, Wifi, WifiOff, Sparkles, Zap, Brain, Image, Mic, Globe, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

type AIStatus = "active" | "inactive" | "error";
type AIProvider = "openai" | "gemini" | "anthropic" | "mistral" | "cohere" | "meta" | "deepseek" | "groq" | "perplexity" | "xai" | "orchestration" | "custom";
type AITaskType = "app_builder" | "code_gen" | "speech_to_text" | "branding" | "content" | "general";

const TASK_LABELS: Record<AITaskType, { label: string; description: string }> = {
  app_builder: { label: "App Builder", description: "AI Builder prompt → config generation" },
  code_gen: { label: "Code Generation", description: "Page code & component generation" },
  speech_to_text: { label: "Speech-to-Text", description: "Voice input transcription" },
  branding: { label: "Branding", description: "Brand name & logo generation" },
  content: { label: "Content Writing", description: "Text, SEO, copywriting" },
  general: { label: "General / Fallback", description: "Default for all other AI tasks" },
};

interface AIIntegration {
  id: string;
  name: string;
  provider: AIProvider;
  model: string;
  apiEndpoint: string;
  apiKey: string;
  status: AIStatus;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
  useFor?: AITaskType[];
}

interface ProviderConfig {
  value: AIProvider;
  label: string;
  models: string[];
  defaultEndpoint: string;
  keyPrefix: string;
  keyPlaceholder: string;
  instructions: {
    steps: string[];
    link: string;
    linkLabel: string;
    notes?: string;
  };
}

const PROVIDERS: ProviderConfig[] = [
  {
    value: "openai",
    label: "OpenAI",
    models: ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-5.2", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o", "gpt-4o-mini", "o3", "o3-mini", "o4-mini", "dall-e-3", "whisper-1", "tts-1", "tts-1-hd"],
    defaultEndpoint: "https://api.openai.com/v1",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-proj-...",
    instructions: {
      steps: [
        "Go to platform.openai.com and sign in or create an account",
        "Navigate to API Keys in the left sidebar (or visit platform.openai.com/api-keys)",
        'Click "Create new secret key"',
        "Give it a name (e.g., RyaanCMS) and click Create",
        "Copy the key immediately — it won't be shown again",
      ],
      link: "https://platform.openai.com/api-keys",
      linkLabel: "OpenAI API Keys Dashboard",
      notes: "Free trial credits may be available. Pay-as-you-go billing starts after.",
    },
  },
  {
    value: "gemini",
    label: "Google Gemini",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemma-3-27b", "gemma-3-12b", "gemma-3-4b", "gemma-3-1b", "imagen-4"],
    defaultEndpoint: "https://generativelanguage.googleapis.com",
    keyPrefix: "AIza",
    keyPlaceholder: "AIza...",
    instructions: {
      steps: [
        "Go to aistudio.google.com",
        'Click "Get API Key" in the top right',
        'Click "Create API key" and select or create a Google Cloud project',
        "Copy the generated API key",
      ],
      link: "https://aistudio.google.com/apikey",
      linkLabel: "Google AI Studio — API Keys",
      notes: "Gemini offers a generous free tier. Paid usage requires a Google Cloud billing account.",
    },
  },
  {
    value: "anthropic",
    label: "Anthropic",
    models: ["claude-sonnet-4-20250514", "claude-3.5-sonnet-20241022", "claude-3.5-haiku-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
    defaultEndpoint: "https://api.anthropic.com/v1",
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-...",
    instructions: {
      steps: [
        "Go to console.anthropic.com and sign in or create an account",
        "Navigate to Settings → API Keys",
        'Click "Create Key"',
        "Name the key (e.g., RyaanCMS) and copy it",
      ],
      link: "https://console.anthropic.com/settings/keys",
      linkLabel: "Anthropic Console — API Keys",
      notes: "New accounts may receive free credits. Check your plan for usage limits.",
    },
  },
  {
    value: "mistral",
    label: "Mistral AI",
    models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "codestral-latest", "mistral-embed", "pixtral-large-latest", "ministral-3b-latest", "ministral-8b-latest"],
    defaultEndpoint: "https://api.mistral.ai/v1",
    keyPrefix: "mist-",
    keyPlaceholder: "mist-...",
    instructions: {
      steps: [
        "Go to console.mistral.ai and sign in or create an account",
        "Navigate to API Keys section",
        'Click "Create new key"',
        "Copy the generated key",
      ],
      link: "https://console.mistral.ai/api-keys",
      linkLabel: "Mistral Console — API Keys",
      notes: "Mistral offers competitive pricing with a free tier for experimentation.",
    },
  },
  {
    value: "cohere",
    label: "Cohere",
    models: ["command-a", "command-r-plus", "command-r", "command-light", "embed-v4.0", "embed-multilingual-v3.0", "rerank-v3.5"],
    defaultEndpoint: "https://api.cohere.com/v2",
    keyPrefix: "",
    keyPlaceholder: "your-cohere-api-key",
    instructions: {
      steps: [
        "Go to dashboard.cohere.com and sign in or create an account",
        "Navigate to API Keys in the dashboard",
        "Copy your default API key or create a new one",
      ],
      link: "https://dashboard.cohere.com/api-keys",
      linkLabel: "Cohere Dashboard — API Keys",
      notes: "Free trial tier available with rate limits. Production use requires a paid plan.",
    },
  },
  {
    value: "meta",
    label: "Meta (Llama)",
    models: ["llama-4-scout", "llama-4-maverick", "llama-3.3-70b", "llama-3.1-405b", "llama-3.1-70b", "llama-3.1-8b"],
    defaultEndpoint: "https://api.together.xyz/v1",
    keyPrefix: "",
    keyPlaceholder: "your-api-key",
    instructions: {
      steps: [
        "Llama models are open-source and hosted by various providers",
        "Sign up at together.ai, fireworks.ai, or groq.com",
        "Navigate to API Keys in your chosen provider's dashboard",
        "Create and copy your API key",
        "Set the API endpoint to your chosen provider's URL",
      ],
      link: "https://api.together.xyz",
      linkLabel: "Together AI (popular Llama host)",
      notes: "Llama is open-source. Choose a hosting provider that fits your needs. Together, Fireworks, and Groq are popular options.",
    },
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner", "deepseek-coder"],
    defaultEndpoint: "https://api.deepseek.com/v1",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-...",
    instructions: {
      steps: [
        "Go to platform.deepseek.com and sign in or create an account",
        "Navigate to API Keys section",
        'Click "Create new API key"',
        "Copy the generated key",
      ],
      link: "https://platform.deepseek.com/api_keys",
      linkLabel: "DeepSeek Platform — API Keys",
      notes: "DeepSeek offers very competitive pricing. Free credits may be available for new users.",
    },
  },
  {
    value: "groq",
    label: "Groq",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it", "mixtral-8x7b-32768", "whisper-large-v3-turbo"],
    defaultEndpoint: "https://api.groq.com/openai/v1",
    keyPrefix: "gsk_",
    keyPlaceholder: "gsk_...",
    instructions: {
      steps: [
        "Go to console.groq.com and sign in with Google or GitHub",
        'Navigate to "API Keys" in the left sidebar',
        'Click "Create API Key"',
        "Name it and copy the key",
      ],
      link: "https://console.groq.com/keys",
      linkLabel: "Groq Console — API Keys",
      notes: "Groq offers extremely fast inference. Free tier available with generous rate limits.",
    },
  },
  {
    value: "perplexity",
    label: "Perplexity",
    models: ["sonar-pro", "sonar", "sonar-deep-research", "sonar-reasoning-pro", "sonar-reasoning", "r1-1776"],
    defaultEndpoint: "https://api.perplexity.ai",
    keyPrefix: "pplx-",
    keyPlaceholder: "pplx-...",
    instructions: {
      steps: [
        "Go to perplexity.ai and sign in",
        "Navigate to Settings → API",
        "Generate a new API key",
        "Copy the key",
      ],
      link: "https://www.perplexity.ai/settings/api",
      linkLabel: "Perplexity — API Settings",
      notes: "Perplexity models include built-in web search. Great for research and fact-checking tasks.",
    },
  },
  {
    value: "xai",
    label: "xAI (Grok)",
    models: ["grok-3", "grok-3-mini", "grok-3-fast", "grok-2", "grok-2-vision"],
    defaultEndpoint: "https://api.x.ai/v1",
    keyPrefix: "xai-",
    keyPlaceholder: "xai-...",
    instructions: {
      steps: [
        "Go to console.x.ai and sign in",
        "Navigate to API Keys",
        'Click "Create API Key"',
        "Copy the generated key",
      ],
      link: "https://console.x.ai",
      linkLabel: "xAI Console",
      notes: "Free credits available for new users. Grok models support multimodal inputs.",
    },
  },
  {
    value: "orchestration",
    label: "Orchestration",
    models: ["multi-agent-pipeline", "requirement-analyst", "task-planner", "system-architect", "ui-ux-designer", "quality-reviewer"],
    defaultEndpoint: "",
    keyPrefix: "",
    keyPlaceholder: "your-orchestration-api-key",
    instructions: {
      steps: [
        "Orchestration routes your prompt through a multi-agent AI pipeline",
        "Agents: Requirement Analyst → Task Planner → System Architect → UI/UX Designer → Quality Reviewer",
        "Configure the API endpoint of your orchestration provider (must be OpenAI-compatible)",
        "Provide your API key for the orchestration service",
        "Assign this integration to 'App Builder' task for full pipeline orchestration",
      ],
      link: "",
      linkLabel: "",
      notes: "Use this provider to power the AI Builder's multi-agent pipeline. It chains multiple specialized agents for comprehensive app generation.",
    },
  },
  {
    value: "custom",
    label: "Custom",
    models: [],
    defaultEndpoint: "",
    keyPrefix: "",
    keyPlaceholder: "your-api-key",
    instructions: {
      steps: [
        "Enter the API endpoint URL for your custom AI provider",
        "The endpoint should be compatible with the OpenAI chat completions format",
        "Provide your API key as issued by your provider",
      ],
      link: "",
      linkLabel: "",
      notes: "Any OpenAI-compatible API endpoint can be used here (e.g., LM Studio, Ollama, vLLM, etc.).",
    },
  },
];

const seedData: AIIntegration[] = [
  { id: "1", name: "Content Writer", provider: "openai", model: "gpt-4o", apiEndpoint: "https://api.openai.com/v1", apiKey: "sk-...abc1", status: "active", usageCount: 12480, lastUsed: "2026-02-13", createdAt: "2025-11-01", useFor: ["content", "general"] },
  { id: "2", name: "Schema Generator", provider: "gemini", model: "gemini-2.5-pro", apiEndpoint: "https://generativelanguage.googleapis.com", apiKey: "AIza...xyz2", status: "active", usageCount: 3210, lastUsed: "2026-02-12", createdAt: "2025-12-15", useFor: ["app_builder"] },
  { id: "3", name: "SEO Optimizer", provider: "anthropic", model: "claude-3-opus-20240229", apiEndpoint: "https://api.anthropic.com/v1", apiKey: "sk-ant...def3", status: "inactive", usageCount: 870, lastUsed: "2026-01-28", createdAt: "2026-01-05", useFor: ["content"] },
  { id: "4", name: "Image Tagger", provider: "gemini", model: "gemini-2.5-flash", apiEndpoint: "https://generativelanguage.googleapis.com", apiKey: "AIza...ghi4", status: "active", usageCount: 5640, lastUsed: "2026-02-13", createdAt: "2025-10-20", useFor: ["speech_to_text", "general"] },
  { id: "5", name: "Layout AI", provider: "openai", model: "gpt-4o-mini", apiEndpoint: "https://api.openai.com/v1", apiKey: "sk-...jkl5", status: "error", usageCount: 142, lastUsed: "2026-02-10", createdAt: "2026-02-01", useFor: ["code_gen"] },
  { id: "6", name: "Workflow Bot", provider: "mistral", model: "mistral-large-latest", apiEndpoint: "https://api.mistral.ai/v1", apiKey: "mist-...mno6", status: "active", usageCount: 980, lastUsed: "2026-02-11", createdAt: "2026-01-18", useFor: ["general"] },
];

const PAGE_SIZE = 5;

const statusConfig: Record<AIStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", icon: CheckCircle2, variant: "default" },
  inactive: { label: "Inactive", icon: XCircle, variant: "secondary" },
  error: { label: "Error", icon: XCircle, variant: "destructive" },
};

const getProviderConfig = (provider: AIProvider): ProviderConfig =>
  PROVIDERS.find((p) => p.value === provider) || PROVIDERS[PROVIDERS.length - 1];

const emptyForm = (): Omit<AIIntegration, "id" | "usageCount" | "lastUsed" | "createdAt"> => ({
  name: "", provider: "openai", model: "", apiEndpoint: PROVIDERS[0].defaultEndpoint, apiKey: "", status: "active", useFor: ["general"],
});

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function AIIntegrationSettings() {
  const [items, setItems] = useState<AIIntegration[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingItemId, setTestingItemId] = useState<string | null>(null);
  const [userModified, setUserModified] = useState(false);
  const { toast } = useToast();

  // Load AI integrations from site_settings
  useEffect(() => {
    const loadIntegrations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", "ai_integrations")
        .maybeSingle();
      if (!error && data?.value && Array.isArray((data.value as any).items)) {
        setItems((data.value as any).items);
      } else {
        // Seed with defaults on first load and persist immediately
        setItems(seedData);
        setUserModified(true);
      }
      setLoaded(true);
    };
    loadIntegrations();
  }, []);

  // Persist AI integrations to site_settings ONLY when user makes changes
  useEffect(() => {
    if (!loaded || !userModified) return;
    const persist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { user_id: user.id, key: "ai_integrations", value: { items } as any },
          { onConflict: "user_id,key" }
        );
      if (error) {
        console.error("Failed to persist AI integrations:", error);
      }
      setUserModified(false);
    };
    persist();
  }, [items, loaded, userModified]);

  const testConnection = async (provider: string, apiEndpoint: string, apiKey: string, model: string, itemId?: string) => {
    if (itemId) {
      setTestingItemId(itemId);
    } else {
      setTestingConnection(true);
    }
    setConnectionResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("test-ai-connection", {
        body: { provider, apiEndpoint, apiKey, model },
      });

      if (error) throw error;

      const result = {
        success: data.success,
        message: data.success ? "Connected successfully!" : (data.error || "Connection failed"),
      };
      
      setConnectionResult(result);

      if (itemId) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, status: data.success ? "active" : "error" }
              : i
          )
        );
        setUserModified(true);
      }

      toast({
        title: data.success ? "✅ Connection Successful" : "❌ Connection Failed",
        description: result.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection test failed";
      setConnectionResult({ success: false, message: msg });
      toast({
        title: "❌ Connection Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
      setTestingItemId(null);
    }
  };

  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.model.toLowerCase().includes(search.toLowerCase());
    const matchProvider = filterProvider === "all" || i.provider === filterProvider;
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchSearch && matchProvider && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openCreate = () => { setForm(emptyForm()); setDialogMode("create"); setEditId(null); setConnectionResult(null); setDialogOpen(true); };
  const openEdit = (item: AIIntegration) => { setForm({ name: item.name, provider: item.provider, model: item.model, apiEndpoint: item.apiEndpoint, apiKey: item.apiKey, status: item.status, useFor: item.useFor || ["general"] }); setDialogMode("edit"); setEditId(item.id); setConnectionResult(null); setDialogOpen(true); };

  const handleProviderChange = (provider: AIProvider) => {
    const config = getProviderConfig(provider);
    setForm((prev) => ({
      ...prev,
      provider,
      model: config.models[0] || "",
      apiEndpoint: config.defaultEndpoint,
      apiKey: "",
    }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.model.trim()) return;
    if (dialogMode === "create") {
      setItems((prev) => [{ ...form, id: crypto.randomUUID(), usageCount: 0, lastUsed: "-", createdAt: new Date().toISOString().slice(0, 10) }, ...prev]);
    } else if (editId) {
      setItems((prev) => prev.map((i) => (i.id === editId ? { ...i, ...form } : i)));
    }
    setUserModified(true);
    setDialogOpen(false);
    toast({ title: "✅ Saved", description: "AI integration saved and synced." });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    setUserModified(true);
    setDeleteId(null);
    toast({ title: "Deleted", description: "AI integration removed." });
  };

  const currentProviderConfig = getProviderConfig(form.provider);

  return (
    <div className="space-y-4">
      {/* Model Recommendation Guide */}
      <Accordion type="single" collapsible className="border border-border rounded-xl bg-card">
        <AccordionItem value="guide" className="border-none">
          <AccordionTrigger className="px-5 py-4 text-sm hover:no-underline">
            <span className="flex items-center gap-2 font-semibold">
              <BookOpen className="w-4 h-4 text-primary" />
              Which API & Model is best for what? — Quick Guide
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Text Generation & Chat */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Brain className="w-4 h-4 text-primary" /> Text / Chat / Reasoning
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li><Badge variant="outline" className="text-[10px] mr-1">Best</Badge>OpenAI <code className="text-[10px]">gpt-5</code> — strongest reasoning</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Best</Badge>Gemini <code className="text-[10px]">gemini-2.5-pro</code> — big context + reasoning</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Fast</Badge>Gemini <code className="text-[10px]">gemini-2.5-flash</code> — balanced speed & quality</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Budget</Badge>OpenAI <code className="text-[10px]">gpt-5-nano</code> — cheapest, simple tasks</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Budget</Badge>DeepSeek <code className="text-[10px]">deepseek-chat</code> — great value</li>
                </ul>
              </div>

              {/* Code Generation */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Zap className="w-4 h-4 text-primary" /> Code Generation
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li><Badge variant="outline" className="text-[10px] mr-1">Best</Badge>Anthropic <code className="text-[10px]">claude-sonnet-4</code> — top coding model</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Best</Badge>OpenAI <code className="text-[10px]">gpt-5</code> — excellent for complex code</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Fast</Badge>Groq <code className="text-[10px]">llama-3.3-70b</code> — ultra-fast inference</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Budget</Badge>DeepSeek <code className="text-[10px]">deepseek-coder</code> — cheapest code model</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Budget</Badge>Mistral <code className="text-[10px]">codestral-latest</code> — good for completions</li>
                </ul>
              </div>

              {/* Voice / Speech */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Mic className="w-4 h-4 text-primary" /> Voice & Speech-to-Text
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li><Badge variant="outline" className="text-[10px] mr-1">Best</Badge>OpenAI <code className="text-[10px]">whisper-1</code> — best multilingual STT</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Fast</Badge>Groq <code className="text-[10px]">whisper-large-v3-turbo</code> — fastest STT</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Good</Badge>Gemini <code className="text-[10px]">gemini-2.5-flash</code> — audio understanding</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">TTS</Badge>OpenAI <code className="text-[10px]">tts-1-hd</code> — text-to-speech</li>
                </ul>
              </div>

              {/* Image */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Image className="w-4 h-4 text-primary" /> Image Generation & Vision
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li><Badge variant="outline" className="text-[10px] mr-1">Best</Badge>Gemini <code className="text-[10px]">imagen-4</code> — top image gen</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Good</Badge>OpenAI <code className="text-[10px]">dall-e-3</code> — creative images</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Vision</Badge>xAI <code className="text-[10px]">grok-2-vision</code> — image understanding</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Vision</Badge>Gemini <code className="text-[10px]">gemini-2.5-pro</code> — multimodal analysis</li>
                </ul>
              </div>

              {/* Search & Research */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Globe className="w-4 h-4 text-primary" /> Search & Research
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li><Badge variant="outline" className="text-[10px] mr-1">Best</Badge>Perplexity <code className="text-[10px]">sonar-pro</code> — web search built-in</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Deep</Badge>Perplexity <code className="text-[10px]">sonar-deep-research</code> — in-depth research</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Good</Badge>Cohere <code className="text-[10px]">command-r-plus</code> — RAG optimized</li>
                </ul>
              </div>

              {/* Multilingual */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="w-4 h-4 text-primary" /> Multilingual & Embeddings
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li><Badge variant="outline" className="text-[10px] mr-1">Best</Badge>Gemini <code className="text-[10px]">gemini-2.5-pro</code> — 100+ languages</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Good</Badge>OpenAI <code className="text-[10px]">gpt-5</code> — strong multilingual</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Embed</Badge>Cohere <code className="text-[10px]">embed-v4.0</code> — best embeddings</li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Embed</Badge>Cohere <code className="text-[10px]">embed-multilingual-v3.0</code></li>
                  <li><Badge variant="outline" className="text-[10px] mr-1">Rerank</Badge>Cohere <code className="text-[10px]">rerank-v3.5</code> — search reranking</li>
                </ul>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground italic">
              💡 Tip: For this CMS, we recommend <strong>OpenAI gpt-5-mini</strong> or <strong>Gemini 2.5 Flash</strong> for general AI tasks (best balance of speed, quality & cost). For voice input, <strong>OpenAI Whisper</strong> gives the most accurate multilingual transcription.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Manage AI platform connections, models, and API keys.</p>
        <Button variant="default" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Integration
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or model…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={filterProvider} onValueChange={(v) => { setFilterProvider(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Use For</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Usage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No integrations found.</TableCell></TableRow>
            ) : paged.map((item) => {
              const sc = statusConfig[item.status];
              const StatusIcon = sc.icon;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{PROVIDERS.find(p => p.value === item.provider)?.label || item.provider}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{item.model}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(item.useFor || []).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">{TASK_LABELS[t]?.label || t}</Badge>
                      ))}
                      {(!item.useFor || item.useFor.length === 0) && <span className="text-muted-foreground text-xs">—</span>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={sc.variant} className="gap-1"><StatusIcon className="w-3 h-3" /> {sc.label}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{item.usageCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Test Connection"
                        onClick={() => testConnection(item.provider, item.apiEndpoint, item.apiKey, item.model, item.id)}
                        disabled={testingItemId === item.id}
                      >
                        {testingItemId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4 text-primary" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} className={safePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <PaginationItem key={n}><PaginationLink isActive={n === safePage} onClick={() => setPage(n)} className="cursor-pointer">{n}</PaginationLink></PaginationItem>
            ))}
            <PaginationItem><PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={safePage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Add AI Integration" : "Edit Integration"}</DialogTitle>
            <DialogDescription>{dialogMode === "create" ? "Connect a new AI platform." : "Update integration details."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input placeholder="e.g. Content Writer" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => handleProviderChange(v as AIProvider)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AIStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Model</Label>
              {currentProviderConfig.models.length > 0 ? (
                <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a model..." /></SelectTrigger>
                  <SelectContent>
                    {currentProviderConfig.models.map((m) => (
                      <SelectItem key={m} value={m}>
                        <span className="font-mono text-xs">{m}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="e.g. my-custom-model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>API Endpoint</Label>
                {currentProviderConfig.defaultEndpoint && (
                  <CopyButton text={currentProviderConfig.defaultEndpoint} />
                )}
              </div>
              <Input
                placeholder={currentProviderConfig.defaultEndpoint || "https://your-api-endpoint.com/v1"}
                value={form.apiEndpoint}
                onChange={(e) => setForm({ ...form, apiEndpoint: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder={currentProviderConfig.keyPlaceholder}
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </div>

            {/* Use For (Task Assignment) */}
            <div className="grid gap-2">
              <Label>Use For (assign tasks to this API)</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(TASK_LABELS) as [AITaskType, { label: string; description: string }][]).map(([key, { label, description }]) => {
                  const selected = form.useFor?.includes(key) || false;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setForm((prev) => {
                          const current = prev.useFor || [];
                          const next = selected ? current.filter((t) => t !== key) : [...current, key];
                          return { ...prev, useFor: next };
                        });
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      }`}
                      title={description}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">Select which tasks should use this API. The system picks the best matching integration per task.</p>
            </div>

            {/* Instructions accordion */}
            <Accordion type="single" collapsible className="border border-border rounded-lg">
              <AccordionItem value="instructions" className="border-none">
                <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    How to get your {currentProviderConfig.label} API key
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    {currentProviderConfig.instructions.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  {currentProviderConfig.instructions.link && (
                    <a
                      href={currentProviderConfig.instructions.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {currentProviderConfig.instructions.linkLabel}
                    </a>
                  )}
                  {currentProviderConfig.instructions.notes && (
                    <p className="mt-2 text-xs text-muted-foreground/80 italic">
                      {currentProviderConfig.instructions.notes}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Connection test result */}
            {connectionResult && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${connectionResult.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {connectionResult.success ? <Wifi className="w-4 h-4 shrink-0" /> : <WifiOff className="w-4 h-4 shrink-0" />}
                {connectionResult.message}
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => testConnection(form.provider, form.apiEndpoint, form.apiKey, form.model)}
              disabled={testingConnection || !form.apiKey || !form.apiEndpoint}
              className="gap-2"
            >
              {testingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
              {testingConnection ? "Testing..." : "Connect API"}
            </Button>
            <div className="flex gap-2 ml-auto">
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="default" onClick={handleSave}>{dialogMode === "create" ? "Create" : "Save Changes"}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Integration</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
