import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Puzzle, CheckCircle, AlertCircle, Settings, Trash2, Loader2, Power } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface InstalledPlugin {
  id: string;
  plugin_id: string;
  is_active: boolean;
  installed_at: string;
  plugin: {
    name: string;
    slug: string;
    version: string;
    description: string;
  };
}

export default function PluginsPage() {
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
      .select("id, plugin_id, is_active, installed_at, plugins(name, slug, version, description)")
      .eq("user_id", user!.id)
      .order("installed_at", { ascending: false });
    if (data) setPlugins(data.map((d: any) => ({ ...d, plugin: d.plugins })));
    setLoading(false);
  };

  const toggleActive = async (p: InstalledPlugin) => {
    setActionId(p.id);
    await supabase.from("user_plugins").update({ is_active: !p.is_active }).eq("id", p.id);
    setPlugins((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Installed Plugins</h1>
            <p className="text-sm text-muted-foreground">Manage your active plugins and extensions.</p>
          </div>
          <Button size="sm" onClick={() => navigate("/dashboard/marketplace")} className="gap-1.5">
            <Puzzle className="w-4 h-4" /> Browse Marketplace
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : plugins.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Puzzle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No plugins installed yet.</p>
            <Button variant="outline" onClick={() => navigate("/dashboard/marketplace")}>Browse Marketplace</Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[1fr_90px_90px_100px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Plugin</span>
              <span>Version</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {plugins.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_90px_90px_100px] gap-4 items-center px-5 py-4 border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Puzzle className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground block truncate">{p.plugin.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate block">{p.plugin.description}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-mono">v{p.plugin.version}</span>
                <div className="flex items-center gap-1.5">
                  {p.is_active ? (
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className={`text-xs ${p.is_active ? "text-primary" : "text-muted-foreground"}`}>
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(p)}
                    disabled={actionId === p.id}
                    className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    title={p.is_active ? "Deactivate" : "Activate"}
                  >
                    {actionId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => uninstall(p)}
                    disabled={actionId === p.id}
                    className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    title="Uninstall"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
