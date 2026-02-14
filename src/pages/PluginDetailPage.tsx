import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Download, Puzzle, ExternalLink, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  demo_url: string | null;
  download_url: string | null;
  created_at: string;
  config_schema: any;
}

export default function PluginDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (slug) loadPlugin();
  }, [slug, user]);

  const loadPlugin = async () => {
    setLoading(true);
    const { data } = await supabase.from("plugins").select("*").eq("slug", slug!).single();
    if (data) {
      setPlugin(data as any);
      if (user) {
        const { data: up } = await supabase.from("user_plugins").select("id").eq("user_id", user.id).eq("plugin_id", data.id);
        if (up && up.length > 0) setInstalled(true);
      }
    }
    setLoading(false);
  };

  const handleInstall = async () => {
    if (!user || !plugin) { toast({ title: "Login required", variant: "destructive" }); return; }
    setInstalling(true);
    try {
      const { error } = await supabase.from("user_plugins").insert({ user_id: user.id, plugin_id: plugin.id });
      if (error) throw error;
      setInstalled(true);
      toast({ title: `${plugin.name} installed!` });
    } catch (err: any) {
      toast({ title: "Install failed", description: err.message, variant: "destructive" });
    }
    setInstalling(false);
  };

  const handleUninstall = async () => {
    if (!user || !plugin) return;
    setInstalling(true);
    try {
      await supabase.from("user_plugins").delete().eq("user_id", user.id).eq("plugin_id", plugin.id);
      setInstalled(false);
      toast({ title: `${plugin.name} uninstalled` });
    } catch (err: any) {
      toast({ title: "Uninstall failed", description: err.message, variant: "destructive" });
    }
    setInstalling(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!plugin) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/marketplace")} className="mb-4 gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Button>
          <p className="text-muted-foreground">Plugin not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/marketplace")} className="mb-6 gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Puzzle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{plugin.name}</h1>
                  <p className="text-sm text-muted-foreground">by {plugin.author || "Unknown"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {plugin.is_official && <Badge variant="secondary">Official</Badge>}
                <Badge variant="outline">v{plugin.version}</Badge>
                <Badge variant="outline" className="capitalize">{plugin.category}</Badge>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {plugin.description || "No description available."}
              </p>
            </div>

            {plugin.tags && plugin.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Tags</h2>
                <div className="flex flex-wrap gap-1.5">
                  {plugin.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {plugin.demo_url && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Live Demo</h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Try this plugin before installing</p>
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={plugin.demo_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" /> Open Live Demo
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                {installed ? (
                  <Button variant="outline" className="w-full gap-1.5" onClick={handleUninstall} disabled={installing}>
                    {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
                    Installed
                  </Button>
                ) : (
                  <Button className="w-full gap-1.5" onClick={handleInstall} disabled={installing}>
                    {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Install Plugin
                  </Button>
                )}

                {plugin.demo_url && (
                  <Button variant="outline" className="w-full gap-1.5" asChild>
                    <a href={plugin.demo_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" /> Live Demo
                    </a>
                  </Button>
                )}

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Star className="w-3.5 h-3.5 text-chart-5 fill-chart-5" /> {plugin.rating}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Installs</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Download className="w-3.5 h-3.5" /> {(plugin.install_count / 1000).toFixed(1)}K
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium text-foreground">{plugin.version}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Author</span>
                    <span className="font-medium text-foreground">{plugin.author || "Unknown"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
