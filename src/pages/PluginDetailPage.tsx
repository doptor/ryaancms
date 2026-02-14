import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Star, Download, Puzzle, Layout, AppWindow,
  ExternalLink, Sparkles, CheckCircle2, Loader2, Eye,
  Calendar, Tag, Shield, Clock, User, ChevronRight, Home,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface MarketplaceItem {
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
  updated_at: string;
  config_schema: any;
  icon: string | null;
  is_free: boolean | null;
  price: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  plugin: "Plugin",
  template: "Template",
  application: "Application",
  theme: "Theme",
  tool: "Tool",
};

const CATEGORY_ICONS: Record<string, typeof Puzzle> = {
  plugin: Puzzle,
  template: Layout,
  application: AppWindow,
};

function getCategoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PluginDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (slug) loadItem();
  }, [slug, user]);

  const loadItem = async () => {
    setLoading(true);
    const { data } = await supabase.from("plugins").select("*").eq("slug", slug!).single();
    if (data) {
      setItem(data as any);
      if (user) {
        const { data: up } = await supabase.from("user_plugins").select("id").eq("user_id", user.id).eq("plugin_id", data.id);
        if (up && up.length > 0) setInstalled(true);
      }
    }
    setLoading(false);
  };

  const handleInstall = async () => {
    if (!user || !item) { toast({ title: "Login required", variant: "destructive" }); return; }
    setInstalling(true);
    try {
      const { error } = await supabase.from("user_plugins").insert({ user_id: user.id, plugin_id: item.id });
      if (error) throw error;
      setInstalled(true);
      toast({ title: `${item.name} installed!` });
    } catch (err: any) {
      toast({ title: "Install failed", description: err.message, variant: "destructive" });
    }
    setInstalling(false);
  };

  const handleUninstall = async () => {
    if (!user || !item) return;
    setInstalling(true);
    try {
      await supabase.from("user_plugins").delete().eq("user_id", user.id).eq("plugin_id", item.id);
      setInstalled(false);
      toast({ title: `${item.name} uninstalled` });
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

  if (!item) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-5xl">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/marketplace")} className="mb-4 gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Button>
          <p className="text-muted-foreground">Item not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const categoryLabel = getCategoryLabel(item.category);
  const IconComp = CATEGORY_ICONS[item.category] || Puzzle;
  const isFree = item.is_free !== false && !item.price;

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-fade-in">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link to="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/dashboard/marketplace" className="hover:text-foreground transition-colors">
            Marketplace
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{item.name}</span>
        </nav>

        {/* Header: Title + Author + Rating */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className="text-xs">{categoryLabel}</Badge>
            {item.is_official && <Badge variant="secondary" className="text-xs gap-1"><Shield className="w-3 h-3" /> Official</Badge>}
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">{item.name}</h1>
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {(item.author || "U")[0].toUpperCase()}
              </div>
              <span className="text-muted-foreground">{item.author || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="w-4 h-4 fill-primary/20 text-primary" />
              <span className="font-medium text-foreground">{item.rating ?? "0.0"}</span>
              <span className="text-muted-foreground">(0 reviews)</span>
            </div>
            <span className="text-muted-foreground">{(item.install_count ?? 0).toLocaleString()} installs</span>
          </div>
        </div>

        {/* Main Grid: Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Preview Image + Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Image Area */}
            <div className="rounded-xl border border-border bg-muted/50 overflow-hidden aspect-video flex items-center justify-center">
              {item.icon ? (
                <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <IconComp className="w-16 h-16 opacity-30" />
                  <span className="text-sm">No preview available</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
                {["description", "details", "changelog"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm capitalize"
                  >
                    {tab === "details" ? "Item Details" : tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="description" className="pt-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {item.description || "No description available."}
                  </p>
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Tag className="w-4 h-4" /> Tags
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs font-normal">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* About The Author */}
                <Card className="mt-6">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3">About The Author</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                        {(item.author || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.author || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">Member since {formatDate(item.created_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Category", value: categoryLabel },
                    { label: "Version", value: item.version },
                    { label: "Author", value: item.author || "Unknown" },
                    { label: "Rating", value: `${item.rating ?? 0} / 5` },
                    { label: "Installs", value: (item.install_count ?? 0).toLocaleString() },
                    { label: "Official", value: item.is_official ? "Yes" : "No" },
                    { label: "Created", value: formatDate(item.created_at) },
                    { label: "Updated", value: formatDate(item.updated_at) },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="changelog" className="pt-4">
                <div className="text-sm text-muted-foreground space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">v{item.version} — Initial Release</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Price & Install Card */}
            <Card className="sticky top-4">
              <CardContent className="p-5 space-y-4">
                {/* Price */}
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {isFree ? "Free" : `$${item.price ?? 0}`}
                  </p>
                  {!isFree && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Use in a single end product
                    </p>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  {[
                    { icon: Shield, text: "Quality checked by RyaanCMS" },
                    { icon: Clock, text: "Lifetime updates" },
                    { icon: CheckCircle2, text: "Easy install & uninstall" },
                  ].map(({ icon: Ic, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Ic className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Install / Uninstall */}
                {installed ? (
                  <Button variant="outline" className="w-full gap-1.5" onClick={handleUninstall} disabled={installing}>
                    {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
                    Installed
                  </Button>
                ) : (
                  <Button className="w-full gap-1.5" onClick={handleInstall} disabled={installing}>
                    {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isFree ? `Install ${categoryLabel}` : `Install — $${item.price ?? 0}`}
                  </Button>
                )}

                {/* Live Preview */}
                <Button
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={() => {
                    if (item.demo_url) {
                      window.open(item.demo_url, "_blank", "noopener,noreferrer");
                    } else {
                      toast({ title: "No preview available", description: "This item doesn't have a live preview yet." });
                    }
                  }}
                >
                  <Eye className="w-4 h-4" /> Live Preview
                </Button>

                <Separator />

                {/* Metadata */}
                <div className="space-y-2.5 text-sm">
                  {[
                    { icon: Calendar, label: "Last Update", value: formatDate(item.updated_at) },
                    { icon: Calendar, label: "Created", value: formatDate(item.created_at) },
                    { icon: Tag, label: "Version", value: item.version },
                    { icon: Download, label: "Installs", value: (item.install_count ?? 0).toLocaleString() },
                  ].map(({ icon: Ic, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Ic className="w-3.5 h-3.5" /> {label}
                      </span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
