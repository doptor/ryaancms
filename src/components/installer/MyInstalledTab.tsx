import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Puzzle, CheckCircle, AlertCircle, Trash2, Loader2, Power,
  Sparkles, Layout, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface InstalledPlugin {
  id: string;
  plugin_id: string;
  is_active: boolean;
  installed_at: string;
  config: Record<string, unknown> | null;
  plugin: {
    name: string;
    slug: string;
    version: string;
    description: string;
    category: string;
    icon: string | null;
  };
}

export default function MyInstalledTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadPlugins();
  }, [user]);

  const loadPlugins = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_plugins")
      .select("id, plugin_id, is_active, installed_at, config, plugins(name, slug, version, description, category, icon)")
      .eq("user_id", user!.id)
      .order("installed_at", { ascending: false });
    if (data) setPlugins(data.map((d: any) => ({ ...d, plugin: d.plugins })));
    setLoading(false);
  };

  const toggleActive = async (p: InstalledPlugin) => {
    setActionId(p.id);
    await supabase.from("user_plugins").update({ is_active: !p.is_active }).eq("id", p.id);
    setPlugins((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
    toast({ title: p.is_active ? "Plugin deactivated" : "Plugin activated" });
    setActionId(null);
  };

  const uninstall = async (p: InstalledPlugin) => {
    setActionId(p.id);
    await supabase.from("user_plugins").delete().eq("id", p.id);
    setPlugins((prev) => prev.filter((x) => x.id !== p.id));
    toast({ title: `${p.plugin.name} uninstalled` });
    setActionId(null);
  };

  const openInBuilder = (p: InstalledPlugin) => {
    const typeLabel = p.plugin.category === "template" ? "template" : p.plugin.category === "ai-tool" ? "AI tool" : p.plugin.category === "application" ? "application" : "plugin";
    const prompt = `Customize the "${p.plugin.name}" ${typeLabel} — ${p.plugin.description}`;
    navigate(`/dashboard/ai?type=${encodeURIComponent(typeLabel)}&slug=${p.plugin.slug}&prompt=${encodeURIComponent(prompt)}`);
  };

  const categoryIcon = (cat: string) => {
    if (cat === "template") return <Layout className="w-4 h-4 text-chart-3" />;
    if (cat === "ai-tool") return <Sparkles className="w-4 h-4 text-chart-2" />;
    return <Puzzle className="w-4 h-4 text-primary" />;
  };

  if (!user) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Please sign in to view your installed items.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (plugins.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <Puzzle className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
        <p className="text-sm text-muted-foreground">No plugins or templates installed yet.</p>
        <p className="text-xs text-muted-foreground">Browse the Marketplace tab to install your first item.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {plugins.length} item{plugins.length !== 1 ? "s" : ""} installed · Toggle to activate or open in AI Builder to customize.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plugins.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-glow transition-all duration-300 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <Badge variant={p.is_active ? "default" : "secondary"} className="text-xs">
                {p.is_active ? "Active" : "Inactive"}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-mono">v{p.plugin.version}</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              {categoryIcon(p.plugin.category)}
              <h3 className="font-semibold text-foreground">{p.plugin.name}</h3>
            </div>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">
              {p.plugin.description || "No description available."}
            </p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 flex-1"
                onClick={() => toggleActive(p)}
                disabled={actionId === p.id}
              >
                {actionId === p.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : p.is_active ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Power className="w-3.5 h-3.5" />
                )}
                {p.is_active ? "Deactivate" : "Activate"}
              </Button>

              <Button
                size="sm"
                className="gap-1.5 flex-1"
                onClick={() => openInBuilder(p)}
              >
                <Sparkles className="w-3.5 h-3.5" /> Customize
              </Button>

              <button
                onClick={() => uninstall(p)}
                disabled={actionId === p.id}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                title="Uninstall"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
