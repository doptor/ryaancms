import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Star, Puzzle, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const tabs = ["All", "Payments", "Communication", "Content", "Analytics"] as const;

const TAG_TO_TAB: Record<string, typeof tabs[number]> = {
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
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("All");
  const [search, setSearch] = useState("");
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlugins();
  }, [user]);

  const loadPlugins = async () => {
    setLoading(true);
    const { data: pluginData } = await supabase.from("plugins").select("*").order("install_count", { ascending: false });
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
    const matchTab = activeTab === "All" || (p.tags || []).some((t) => TAG_TO_TAB[t] === activeTab);
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Discover and install plugins, templates, and applications to extend your CMS.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
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
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTab === tab ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"}`}
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
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-muted-foreground" />
                      {plugin.rating}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Puzzle className="w-4 h-4 text-muted-foreground" />
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
      </div>
    </DashboardLayout>
  );
}
