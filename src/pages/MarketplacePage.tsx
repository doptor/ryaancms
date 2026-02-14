import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Download, Star, Puzzle, Sparkles, CheckCircle2, Loader2,
  Upload, FileArchive, Link2, CheckCircle, ArrowRight,
  Play, RotateCcw, XCircle, Terminal, Package, ExternalLink, ShoppingCart,
  Layout,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import InstallDialog from "@/components/InstallDialog";
import MyInstalledTab from "@/components/installer/MyInstalledTab";

const browseFilters = ["All", "Payments", "Communication", "Content", "Analytics"] as const;

const TAG_TO_TAB: Record<string, typeof browseFilters[number]> = {
  payments: "Payments", stripe: "Payments", billing: "Payments",
  sms: "Communication", whatsapp: "Communication", messaging: "Communication", email: "Communication", chat: "Communication",
  ai: "Content", content: "Content", writing: "Content", seo: "Content", i18n: "Content", forms: "Content",
  analytics: "Analytics", dashboard: "Analytics", reports: "Analytics",
};

interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  author: string;
  rating: number;
  install_count: number;
  tags: string[];
  is_official: boolean;
  price: number;
  is_free: boolean;
  demo_url: string | null;
}

type BuildStep = {
  label: string;
  status: "pending" | "running" | "success" | "error" | "retrying";
  logs: string[];
  attempt: number;
};

const INITIAL_BUILD_STEPS: Omit<BuildStep, "status" | "logs" | "attempt">[] = [
  { label: "📦 Installing dependencies (npm install)" },
  { label: "🔨 Compiling project (npm run build)" },
  { label: "🧪 Running tests (npm test)" },
  { label: "🔐 Security audit (npm audit)" },
  { label: "📊 Bundle analysis" },
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<typeof browseFilters[number]>("All");
  const [search, setSearch] = useState("");
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Import tab state
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [installItem, setInstallItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Build loop state
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [isBuildRunning, setIsBuildRunning] = useState(false);
  const [buildComplete, setBuildComplete] = useState(false);
  const [totalRetries, setTotalRetries] = useState(0);

  useEffect(() => {
    loadPlugins();
  }, [user]);

  const loadPlugins = async () => {
    setLoading(true);
    const { data: pluginData } = await supabase.from("plugins").select("*").eq("approval_status", "approved").order("install_count", { ascending: false });
    if (pluginData) setPlugins(pluginData as any);

    if (user) {
      const { data: installed } = await supabase.from("user_plugins").select("plugin_id").eq("user_id", user.id);
      if (installed) setInstalledIds(new Set(installed.map((i: any) => i.plugin_id)));
    }
    setLoading(false);
  };

  const handleInstall = async (plugin: Plugin) => {
    if (!user) { toast({ title: "Login required", variant: "destructive" }); return; }
    setInstalling(plugin.id);
    try {
      const { error } = await supabase.from("user_plugins").insert({ user_id: user.id, plugin_id: plugin.id });
      if (error) throw error;
      setInstalledIds((prev) => new Set([...prev, plugin.id]));
      toast({ title: `${plugin.name} installed!` });
    } catch (err: any) {
      toast({ title: "Install failed", description: err.message, variant: "destructive" });
    }
    setInstalling(null);
  };

  const handleUninstall = async (plugin: Plugin) => {
    if (!user) return;
    setInstalling(plugin.id);
    try {
      await supabase.from("user_plugins").delete().eq("user_id", user.id).eq("plugin_id", plugin.id);
      setInstalledIds((prev) => { const s = new Set(prev); s.delete(plugin.id); return s; });
      toast({ title: `${plugin.name} uninstalled` });
    } catch (err: any) {
      toast({ title: "Uninstall failed", description: err.message, variant: "destructive" });
    }
    setInstalling(null);
  };

  const filtered = plugins.filter((p) => {
    const matchTab = activeFilter === "All" || (p.tags || []).some((t) => TAG_TO_TAB[t] === activeFilter);
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // Import handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file.name);
      setInstallItem({ name: file.name.replace(".rypkg", ""), type: "Plugin", rating: 0, installs: "—", tag: "Local", desc: "Uploaded package", price: 0, demoUrl: "" });
      setDialogOpen(true);
    }
  };

  const handleUrlInstall = () => {
    if (!urlInput.trim()) return;
    const name = urlInput.split("/").pop()?.replace(".rypkg", "") || "Package";
    setInstallItem({ name, type: "Plugin", rating: 0, installs: "—", tag: "Remote", desc: `Installed from ${urlInput}`, price: 0, demoUrl: "" });
    setDialogOpen(true);
    setUrlInput("");
  };

  // Build loop
  const runBuildLoop = async () => {
    setIsBuildRunning(true);
    setBuildComplete(false);
    setTotalRetries(0);
    const steps: BuildStep[] = INITIAL_BUILD_STEPS.map((s) => ({ ...s, status: "pending" as const, logs: [], attempt: 0 }));
    setBuildSteps([...steps]);
    const MAX_RETRIES = 5;

    for (let i = 0; i < steps.length; i++) {
      steps[i].status = "running";
      steps[i].attempt = 1;
      setBuildSteps([...steps]);
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

      const failChance = (i === 2 || i === 3) ? 0.3 : 0.1;
      let succeeded = Math.random() > failChance;

      if (!succeeded) {
        let retries = 0;
        while (!succeeded && retries < MAX_RETRIES) {
          steps[i].status = "error";
          steps[i].logs.push(`❌ Attempt ${steps[i].attempt} failed: ${getErrorMessage(i)}`);
          setBuildSteps([...steps]);
          await new Promise((r) => setTimeout(r, 600));
          retries++;
          steps[i].attempt++;
          steps[i].status = "retrying";
          steps[i].logs.push(`🔄 Debugger Agent fixing... (attempt ${steps[i].attempt}/${MAX_RETRIES})`);
          setBuildSteps([...steps]);
          setTotalRetries((prev) => prev + 1);
          await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));
          succeeded = Math.random() > (0.2 / (retries + 1));
        }
        if (!succeeded) {
          steps[i].status = "error";
          steps[i].logs.push(`⛔ Max retries reached. Manual fix needed.`);
          setBuildSteps([...steps]);
          setIsBuildRunning(false);
          setBuildComplete(true);
          return;
        }
      }
      steps[i].status = "success";
      steps[i].logs.push(`✅ Completed successfully${steps[i].attempt > 1 ? ` (after ${steps[i].attempt} attempts)` : ""}`);
      setBuildSteps([...steps]);
    }
    setIsBuildRunning(false);
    setBuildComplete(true);
  };

  const getErrorMessage = (stepIndex: number): string => {
    const errors = [
      ["Missing peer dependency: react@^18", "Module not found: @radix-ui/react-slot"],
      ["TypeScript error: TS2345 in Dashboard.tsx", "Cannot find module './components/Stats'"],
      ["Test failed: AuthForm.test.tsx - Expected redirect after login", "Jest encountered unexpected token"],
      ["3 moderate vulnerabilities found", "Prototype pollution in lodash < 4.17.21"],
      ["Bundle size exceeds limit: 512KB > 500KB", "Circular dependency detected"],
    ];
    return errors[stepIndex]?.[Math.floor(Math.random() * 2)] || "Unknown error";
  };

  const allStepsSucceeded = buildSteps.length > 0 && buildSteps.every((s) => s.status === "success");

  const typeIcon = (cat: string) => {
    if (cat === "template") return <Layout className="w-4 h-4 text-chart-3" />;
    if (cat === "ai-tool" || cat === "tool") return <Sparkles className="w-4 h-4 text-chart-2" />;
    return <Puzzle className="w-4 h-4 text-primary" />;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Package className="w-4 h-4 text-primary-foreground" />
              </span>
              Marketplace
            </h1>
            <p className="text-sm text-muted-foreground">Browse, install, manage & import plugins, templates, and tools.</p>
          </div>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse" className="gap-1.5"><Puzzle className="w-3.5 h-3.5" /> Browse</TabsTrigger>
            <TabsTrigger value="installed" className="gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> My Installed</TabsTrigger>
            <TabsTrigger value="import" className="gap-1.5"><Upload className="w-3.5 h-3.5" /> Import</TabsTrigger>
            <TabsTrigger value="build" className="gap-1.5"><Terminal className="w-3.5 h-3.5" /> Build Loop</TabsTrigger>
          </TabsList>

          {/* ─── Browse Tab ─── */}
          <TabsContent value="browse" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search marketplace..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {browseFilters.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${activeFilter === tab ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((plugin) => {
                  const isInstalled = installedIds.has(plugin.id);
                  return (
                    <div key={plugin.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-sm hover:border-border/80 transition-all duration-200 cursor-pointer" onClick={() => navigate(`/dashboard/marketplace/${plugin.slug}`)}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex gap-1.5">
                          {plugin.is_official && <Badge variant="secondary" className="text-[10px]">Official</Badge>}
                          <Badge variant="outline" className="text-[10px]">v{plugin.version}</Badge>
                          {!plugin.is_free && plugin.price > 0 && (
                            <Badge className="text-[10px] bg-chart-5/20 text-chart-5 border-chart-5/30">${plugin.price}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 text-muted-foreground" />
                          {plugin.rating}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {typeIcon(plugin.category)}
                        <h3 className="font-semibold text-foreground text-sm">{plugin.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{plugin.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(plugin.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground"><Download className="w-3 h-3 inline mr-1" />{(plugin.install_count / 1000).toFixed(1)}K</span>
                        {isInstalled ? (
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleUninstall(plugin); }} disabled={installing === plugin.id} className="gap-1">
                            {installing === plugin.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 text-primary" />}
                            Installed
                          </Button>
                        ) : (
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); handleInstall(plugin); }} disabled={installing === plugin.id} className="gap-1">
                            {installing === plugin.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Install
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── My Installed Tab ─── */}
          <TabsContent value="installed" className="space-y-6">
            <div className="rounded-xl p-5 text-primary-foreground relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--chart-2)), hsl(var(--chart-5)))" }}>
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-primary-foreground/10 blur-2xl" />
              <h2 className="text-lg font-bold relative z-10">✨ My Installed Items</h2>
              <p className="text-sm opacity-90 mt-1 relative z-10">Activate, deactivate or customize your plugins, templates & apps in AI Builder.</p>
            </div>
            <MyInstalledTab />
          </TabsContent>

          {/* ─── Import Tab ─── */}
          <TabsContent value="import" className="space-y-6">
            <div className="rounded-xl bg-gradient-accent p-5 text-primary-foreground relative overflow-hidden">
              <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-primary-foreground/10 blur-2xl" />
              <h2 className="text-lg font-bold relative z-10">📦 Import Your Packages</h2>
              <p className="text-sm opacity-90 mt-1 relative z-10">Upload a .rypkg file or install directly from a URL.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-chart-3/20 bg-gradient-to-br from-chart-3/5 to-primary/5 p-6 flex flex-col items-center text-center hover:shadow-glow transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-primary-lg">
                  <FileArchive className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Upload .rypkg File</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-xs">Drag & drop or browse to upload a plugin or template package.</p>
                <input ref={fileRef} type="file" accept=".rypkg,.zip" className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="border-chart-3/30 hover:border-chart-3/50">
                  <Upload className="w-3.5 h-3.5" /> Browse Files
                </Button>
                {uploadFile && (
                  <p className="text-xs text-chart-4 mt-3 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {uploadFile}</p>
                )}
              </div>

              <div className="rounded-xl border border-chart-2/20 bg-gradient-to-br from-chart-2/5 to-chart-5/5 p-6 flex flex-col items-center text-center hover:shadow-glow transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-accent flex items-center justify-center mb-4 shadow-primary-lg">
                  <Link2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Install from URL</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-xs">Paste a direct link to a .rypkg package or Git repository URL.</p>
                <div className="flex gap-2 w-full max-w-sm">
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/plugin.rypkg"
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button size="sm" onClick={handleUrlInstall} className="shadow-primary-lg">Install</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── Build Loop Tab ─── */}
          <TabsContent value="build" className="space-y-6">
            <div className="rounded-xl p-5 text-primary-foreground relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--chart-4)), hsl(var(--chart-3)))" }}>
              <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-primary-foreground/10 blur-2xl" />
              <h2 className="text-lg font-bold relative z-10">⚡ Autonomous Build Loop</h2>
              <p className="text-sm opacity-90 mt-1 relative z-10">Build → test → error → AI auto-fix → retry (max 5 retries)</p>
            </div>

            <div className="rounded-xl border border-chart-4/20 bg-gradient-to-br from-chart-4/5 to-chart-3/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-chart-4/15 flex items-center justify-center">
                    <Terminal className="w-4 h-4 text-chart-4" />
                  </div>
                  Build Pipeline
                </h3>
                <Button onClick={runBuildLoop} disabled={isBuildRunning} className="gap-1.5 shadow-primary-lg" size="sm">
                  {isBuildRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {isBuildRunning ? "Running..." : "Start Build"}
                </Button>
              </div>

              {buildSteps.length > 0 ? (
                <div className="space-y-3">
                  {buildSteps.map((step, i) => (
                    <div key={i} className={cn(
                      "rounded-lg border p-3 transition-all bg-gradient-to-r",
                      step.status === "success" ? "border-chart-4/40 from-chart-4/10 to-chart-3/10" :
                      step.status === "error" ? "border-destructive/30 from-destructive/10 to-destructive/5" :
                      step.status === "running" || step.status === "retrying" ? "border-primary/50 from-primary/10 to-chart-2/10" :
                      "from-muted/50 to-muted/30 border-border"
                    )}>
                      <div className="flex items-center gap-2">
                        {step.status === "success" && <CheckCircle2 className="w-4 h-4 text-chart-4 shrink-0" />}
                        {step.status === "error" && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                        {step.status === "running" && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
                        {step.status === "retrying" && <RotateCcw className="w-4 h-4 text-chart-5 animate-spin shrink-0" />}
                        {step.status === "pending" && <Package className="w-4 h-4 text-muted-foreground shrink-0" />}
                        <span className={cn(
                          "text-sm font-medium",
                          step.status === "success" ? "text-chart-4" :
                          step.status === "error" ? "text-destructive" :
                          step.status === "running" || step.status === "retrying" ? "text-foreground" :
                          "text-muted-foreground"
                        )}>{step.label}</span>
                        {step.attempt > 1 && (
                          <Badge variant="outline" className="text-[10px] h-4 ml-auto border-chart-5/30 text-chart-5">
                            Attempt {step.attempt}
                          </Badge>
                        )}
                      </div>
                      {step.logs.length > 0 && (
                        <div className="mt-2 space-y-0.5 pl-6">
                          {step.logs.map((log, j) => (
                            <p key={j} className="text-[11px] font-mono text-muted-foreground">{log}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {buildComplete && (
                    <div className={cn(
                      "rounded-lg border p-4 text-center",
                      allStepsSucceeded
                        ? "border-chart-4/40 bg-gradient-to-r from-chart-4/10 to-chart-3/10"
                        : "border-destructive/30 bg-gradient-to-r from-destructive/10 to-destructive/5"
                    )}>
                      {allStepsSucceeded ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 text-chart-4 mx-auto mb-2" />
                          <p className="font-semibold text-foreground">Build Successful! 🎉</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            All steps passed{totalRetries > 0 ? ` with ${totalRetries} auto-fix retries` : ""}. Ready for deployment.
                          </p>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                          <p className="font-semibold text-foreground">Build Failed</p>
                          <p className="text-xs text-muted-foreground mt-1">Some steps failed after maximum retries.</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-4/20 to-chart-3/20 flex items-center justify-center mx-auto mb-3">
                    <Terminal className="w-6 h-6 text-chart-4" />
                  </div>
                  <p className="text-sm">Click "Start Build" to run the autonomous build loop.</p>
                  <p className="text-xs mt-1">AI will automatically detect errors, fix them, and retry.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <InstallDialog open={dialogOpen} onOpenChange={setDialogOpen} item={installItem} onInstallComplete={loadPlugins} />
      </div>
    </DashboardLayout>
  );
}
