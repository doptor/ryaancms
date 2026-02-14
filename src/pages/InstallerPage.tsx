import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Search, Download, Star, Puzzle, Layout, Sparkles,
  Upload, FileArchive, Link2, CheckCircle, ArrowRight,
  Loader2, Play, RotateCcw, CheckCircle2, XCircle,
  Terminal, Package,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import InstallDialog from "@/components/InstallDialog";
import MyInstalledTab from "@/components/installer/MyInstalledTab";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const marketplaceItems = [
  { name: "SEO Pro", type: "Plugin", rating: 4.9, installs: "12.4K", tag: "Popular", desc: "Advanced SEO toolkit with AI-powered suggestions." },
  { name: "E-Commerce Starter", type: "Template", rating: 4.8, installs: "8.2K", tag: "Featured", desc: "Complete storefront with cart, checkout, and product pages." },
  { name: "AI Content Writer", type: "AI Tool", rating: 4.7, installs: "15.1K", tag: "AI", desc: "Generate blog posts, product descriptions, and more." },
  { name: "Analytics Dashboard", type: "Plugin", rating: 4.6, installs: "6.3K", tag: "New", desc: "Real-time analytics with custom dashboards and reports." },
  { name: "SaaS Landing Page", type: "Template", rating: 4.9, installs: "9.8K", tag: "Popular", desc: "Conversion-optimized landing page with pricing tables." },
  { name: "AI Image Tagger", type: "AI Tool", rating: 4.5, installs: "4.1K", tag: "AI", desc: "Auto-tag images with AI for better media management." },
  { name: "Form Builder", type: "Plugin", rating: 4.7, installs: "11.2K", tag: "Popular", desc: "Drag-and-drop form builder with validation and webhooks." },
  { name: "Blog Theme", type: "Template", rating: 4.6, installs: "7.5K", tag: "Featured", desc: "Clean, minimal blog template with dark mode support." },
  { name: "Multi-Language", type: "Plugin", rating: 4.4, installs: "5.9K", tag: "New", desc: "i18n plugin with AI-powered translation support." },
];

const typeFilters = ["All", "Plugins", "Templates", "AI Tools"] as const;

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

export default function InstallerPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("All");
  const [installItem, setInstallItem] = useState<typeof marketplaceItems[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());

  const loadInstalledSlugs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_plugins")
      .select("plugins(slug)")
      .eq("user_id", user.id);
    if (data) {
      const slugs = new Set(data.map((d: any) => d.plugins?.slug).filter(Boolean));
      setInstalledSlugs(slugs as Set<string>);
    }
  }, [user]);

  useEffect(() => {
    loadInstalledSlugs();
  }, [loadInstalledSlugs]);

  // Build loop state
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [isBuildRunning, setIsBuildRunning] = useState(false);
  const [buildComplete, setBuildComplete] = useState(false);
  const [totalRetries, setTotalRetries] = useState(0);

  const filtered = marketplaceItems.filter((item) => {
    const matchType =
      activeType === "All" ||
      (activeType === "Plugins" && item.type === "Plugin") ||
      (activeType === "Templates" && item.type === "Template") ||
      (activeType === "AI Tools" && item.type === "AI Tool");
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleInstall = (item: typeof marketplaceItems[0]) => {
    setInstallItem(item);
    setDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file.name);
      setInstallItem({ name: file.name.replace(".rypkg", ""), type: "Plugin", rating: 0, installs: "—", tag: "Local", desc: "Uploaded package" });
      setDialogOpen(true);
    }
  };

  const handleUrlInstall = () => {
    if (!urlInput.trim()) return;
    const name = urlInput.split("/").pop()?.replace(".rypkg", "") || "Package";
    setInstallItem({ name, type: "Plugin", rating: 0, installs: "—", tag: "Remote", desc: `Installed from ${urlInput}` });
    setDialogOpen(true);
    setUrlInput("");
  };

  // === Autonomous Build Loop ===
  const runBuildLoop = async () => {
    setIsBuildRunning(true);
    setBuildComplete(false);
    setTotalRetries(0);

    const steps: BuildStep[] = INITIAL_BUILD_STEPS.map((s) => ({
      ...s,
      status: "pending",
      logs: [],
      attempt: 0,
    }));
    setBuildSteps([...steps]);

    const MAX_RETRIES = 5;

    for (let i = 0; i < steps.length; i++) {
      steps[i].status = "running";
      steps[i].attempt = 1;
      setBuildSteps([...steps]);

      // Simulate step execution
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

      // Simulate occasional failures (30% chance for test/audit steps)
      const failChance = (i === 2 || i === 3) ? 0.3 : 0.1;
      let succeeded = Math.random() > failChance;

      if (!succeeded) {
        // Error + retry loop
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

          // Higher success chance on retries
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

  const typeIcon = (type: string) => {
    if (type === "Plugin") return <Puzzle className="w-4 h-4 text-primary" />;
    if (type === "Template") return <Layout className="w-4 h-4 text-chart-3" />;
    return <Sparkles className="w-4 h-4 text-chart-2" />;
  };

  const allStepsSucceeded = buildSteps.length > 0 && buildSteps.every((s) => s.status === "success");

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        {/* Colorful header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Package className="w-4 h-4 text-primary-foreground" />
              </span>
              Installer
            </h1>
            <p className="text-sm text-muted-foreground">Browse, upload, build & test your projects.</p>
          </div>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList>
            <TabsTrigger value="marketplace" className="gap-1.5"><Puzzle className="w-3.5 h-3.5" /> Marketplace</TabsTrigger>
            <TabsTrigger value="installed" className="gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> My Installed</TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5"><Upload className="w-3.5 h-3.5" /> Upload / Import</TabsTrigger>
            <TabsTrigger value="build" className="gap-1.5"><Terminal className="w-3.5 h-3.5" /> Build Loop</TabsTrigger>
          </TabsList>

          {/* ─── Marketplace Tab ─── */}
          <TabsContent value="marketplace" className="space-y-6">
            {/* Colorful hero banner */}
            <div className="rounded-xl bg-gradient-primary p-5 text-primary-foreground relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary-foreground/10 blur-2xl" />
              <div className="absolute right-20 -bottom-6 w-24 h-24 rounded-full bg-primary-foreground/5 blur-xl" />
              <h2 className="text-lg font-bold relative z-10">🚀 Explore the Marketplace</h2>
              <p className="text-sm opacity-90 mt-1 relative z-10">Discover plugins, templates & AI tools to supercharge your project.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search plugins, templates, AI tools..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-1">
                {typeFilters.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                      activeType === t
                        ? "bg-gradient-primary text-primary-foreground font-medium shadow-primary-lg"
                        : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item, idx) => {
                const slug = item.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                const isInstalled = installedSlugs.has(slug);
                const colors = [
                  "from-primary/10 to-chart-2/10 border-primary/20",
                  "from-chart-3/10 to-primary/10 border-chart-3/20",
                  "from-chart-2/10 to-chart-5/10 border-chart-2/20",
                  "from-chart-5/10 to-chart-4/10 border-chart-5/20",
                  "from-chart-4/10 to-chart-3/10 border-chart-4/20",
                ];
                const colorClass = colors[idx % colors.length];
                return (
                  <div key={item.name} className={cn(
                    "rounded-xl border p-5 hover:shadow-glow transition-all duration-300 flex flex-col bg-gradient-to-br",
                    colorClass
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", 
                            item.tag === "Popular" && "bg-chart-5/20 text-chart-5 border-chart-5/30",
                            item.tag === "Featured" && "bg-primary/20 text-primary border-primary/30",
                            item.tag === "AI" && "bg-chart-2/20 text-chart-2 border-chart-2/30",
                            item.tag === "New" && "bg-chart-4/20 text-chart-4 border-chart-4/30",
                          )}
                        >{item.tag}</Badge>
                        {isInstalled && (
                          <Badge className="text-[10px] bg-chart-4/20 text-chart-4 border-chart-4/30 gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" /> Installed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-chart-5 fill-chart-5" />{item.rating}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center",
                        item.type === "Plugin" && "bg-primary/15",
                        item.type === "Template" && "bg-chart-3/15",
                        item.type === "AI Tool" && "bg-chart-2/15",
                      )}>
                        {typeIcon(item.type)}
                      </div>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">{item.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground"><Download className="w-3 h-3 inline mr-1" />{item.installs}</span>
                      {isInstalled ? (
                        <Button size="sm" variant="outline" disabled className="gap-1 opacity-70">
                          <CheckCircle className="w-3.5 h-3.5 text-chart-4" /> Installed
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleInstall(item)} className="shadow-primary-lg">
                          <ArrowRight className="w-3.5 h-3.5" /> Install
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground text-sm">No items match your search.</div>
              )}
            </div>
          </TabsContent>
          {/* ─── My Installed Tab ─── */}
          <TabsContent value="installed" className="space-y-6">
            {/* Colorful hero */}
            <div className="rounded-xl p-5 text-primary-foreground relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--chart-2)), hsl(var(--chart-5)))" }}>
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-primary-foreground/10 blur-2xl" />
              <h2 className="text-lg font-bold relative z-10">✨ My Installed Items</h2>
              <p className="text-sm opacity-90 mt-1 relative z-10">Activate, deactivate or customize your plugins, templates & apps in AI Builder.</p>
            </div>
            <MyInstalledTab />
          </TabsContent>

          {/* ─── Upload / Import Tab ─── */}
          <TabsContent value="upload" className="space-y-6">
            {/* Colorful hero */}
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

          {/* ─── Autonomous Build Loop Tab ─── */}
          <TabsContent value="build" className="space-y-6">
            {/* Colorful hero */}
            <div className="rounded-xl p-5 text-primary-foreground relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--chart-4)), hsl(var(--chart-3)))" }}>
              <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-primary-foreground/10 blur-2xl" />
              <h2 className="text-lg font-bold relative z-10">⚡ Autonomous Build Loop</h2>
              <p className="text-sm opacity-90 mt-1 relative z-10">Build → test → error → AI auto-fix → retry (max 5 retries)</p>
            </div>

            <div className="rounded-xl border border-chart-4/20 bg-gradient-to-br from-chart-4/5 to-chart-3/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-chart-4/15 flex items-center justify-center">
                      <Terminal className="w-4 h-4 text-chart-4" />
                    </div>
                    Build Pipeline
                  </h3>
                </div>
                <Button
                  onClick={runBuildLoop}
                  disabled={isBuildRunning}
                  className="gap-1.5 shadow-primary-lg"
                  size="sm"
                >
                  {isBuildRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {isBuildRunning ? "Running..." : "Start Build"}
                </Button>
              </div>

              {buildSteps.length > 0 && (
                <div className="space-y-3">
                  {buildSteps.map((step, i) => {
                    const stepColors = [
                      "from-primary/8 to-chart-2/8 border-primary/25",
                      "from-chart-3/8 to-primary/8 border-chart-3/25",
                      "from-chart-5/8 to-chart-2/8 border-chart-5/25",
                      "from-chart-4/8 to-chart-3/8 border-chart-4/25",
                      "from-chart-2/8 to-chart-5/8 border-chart-2/25",
                    ];
                    return (
                      <div key={i} className={cn(
                        "rounded-lg border p-3 transition-all bg-gradient-to-r",
                        step.status === "success" ? "border-chart-4/40 from-chart-4/10 to-chart-3/10" :
                        step.status === "error" ? "border-destructive/30 from-destructive/10 to-destructive/5" :
                        step.status === "running" || step.status === "retrying" ? "border-primary/50 from-primary/10 to-chart-2/10" :
                        stepColors[i % stepColors.length]
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
                          )}>
                            {step.label}
                          </span>
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
                    );
                  })}

                  {/* Build summary */}
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
                            All steps passed{totalRetries > 0 ? ` with ${totalRetries} auto-fix retries` : ""}.
                            Project is ready for deployment.
                          </p>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                          <p className="font-semibold text-foreground">Build Failed</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Some steps failed after maximum retries. Check logs above.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {buildSteps.length === 0 && (
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

        <InstallDialog open={dialogOpen} onOpenChange={setDialogOpen} item={installItem} onInstallComplete={loadInstalledSlugs} />
      </div>
    </DashboardLayout>
  );
}
