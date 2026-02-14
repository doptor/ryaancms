import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Package, Search, Download, Star, CheckCircle2, Eye, Code, Filter, TrendingUp, Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface Props {
  pipelineState: PipelineState | null;
}

type MarketplaceComponent = {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  downloads: number;
  rating: number;
  tags: string[];
  installed: boolean;
  preview?: string;
};

const COMPONENTS: MarketplaceComponent[] = [
  { id: "hero-1", name: "Hero Section Pro", description: "Animated hero with gradient text, CTA buttons, and floating elements", category: "Landing", author: "RyaanUI", downloads: 12400, rating: 4.9, tags: ["hero", "landing", "animated"], installed: false },
  { id: "pricing-1", name: "Pricing Table", description: "3-tier pricing with toggle, feature comparison, and popular badge", category: "Commerce", author: "RyaanUI", downloads: 9800, rating: 4.8, tags: ["pricing", "saas", "commerce"], installed: false },
  { id: "auth-1", name: "Auth Kit", description: "Login, signup, forgot password, OTP — complete auth flow components", category: "Auth", author: "RyaanUI", downloads: 15200, rating: 4.9, tags: ["auth", "login", "signup"], installed: false },
  { id: "dashboard-1", name: "Analytics Dashboard", description: "KPI cards, charts, activity feed, and data tables in one kit", category: "Dashboard", author: "Community", downloads: 8600, rating: 4.7, tags: ["dashboard", "charts", "analytics"], installed: false },
  { id: "chat-1", name: "Chat Widget", description: "Real-time chat UI with typing indicators, file sharing, and reactions", category: "Communication", author: "Community", downloads: 6300, rating: 4.6, tags: ["chat", "messaging", "realtime"], installed: false },
  { id: "table-1", name: "Data Table Pro", description: "Sortable, filterable, paginated table with inline editing and export", category: "Data", author: "RyaanUI", downloads: 11200, rating: 4.8, tags: ["table", "data", "crud"], installed: false },
  { id: "file-1", name: "File Upload Zone", description: "Drag-and-drop file upload with preview, progress bar, and validation", category: "Media", author: "Community", downloads: 7400, rating: 4.5, tags: ["upload", "file", "media"], installed: false },
  { id: "nav-1", name: "Navigation Kit", description: "Responsive navbar, sidebar, breadcrumbs, and mobile drawer", category: "Layout", author: "RyaanUI", downloads: 13100, rating: 4.9, tags: ["navigation", "sidebar", "layout"], installed: false },
  { id: "form-1", name: "Smart Form Builder", description: "Multi-step forms with validation, conditional fields, and auto-save", category: "Forms", author: "Community", downloads: 5800, rating: 4.4, tags: ["form", "validation", "wizard"], installed: false },
  { id: "notif-1", name: "Notification Center", description: "Toast notifications, notification bell, and in-app notification panel", category: "Communication", author: "RyaanUI", downloads: 4200, rating: 4.6, tags: ["notification", "toast", "alert"], installed: false },
  { id: "ecom-1", name: "E-Commerce Kit", description: "Product cards, cart, checkout flow, and order summary components", category: "Commerce", author: "Community", downloads: 7900, rating: 4.7, tags: ["ecommerce", "cart", "checkout"], installed: false },
  { id: "blog-1", name: "Blog Components", description: "Article cards, rich text renderer, author bio, and comment section", category: "Content", author: "Community", downloads: 3600, rating: 4.3, tags: ["blog", "content", "article"], installed: false },
];

const CATEGORIES = ["All", "Landing", "Commerce", "Auth", "Dashboard", "Communication", "Data", "Media", "Layout", "Forms", "Content"];

export function ComponentMarketplacePanel({ pipelineState }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [components, setComponents] = useState(COMPONENTS);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const config = pipelineState?.config;

  const filtered = components.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.tags.some(t => t.includes(search.toLowerCase()));
    const matchesCat = category === "All" || c.category === category;
    return matchesSearch && matchesCat;
  });

  const handleInstall = (id: string) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, installed: true } : c));
    const comp = components.find(c => c.id === id);
    toast({ title: `📦 ${comp?.name} installed!`, description: "Component added to your project." });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatDownloads = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Package className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Component Marketplace</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to browse and install components.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Component Marketplace</h3>
            <p className="text-[11px] text-muted-foreground">{components.filter(c => c.installed).length} installed · {COMPONENTS.length} available</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search components..." className="pl-8 text-xs h-8" />
        </div>

        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors border",
                category === cat ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2.5">
          {filtered.map((comp) => (
            <div key={comp.id} className={cn(
              "rounded-xl border p-3 space-y-2 transition-colors",
              comp.installed ? "border-primary/30 bg-primary/5" : "border-border"
            )}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-medium text-foreground truncate">{comp.name}</h4>
                    {comp.installed && (
                      <Badge variant="secondary" className="text-[9px] gap-0.5 text-primary shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Installed
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{comp.description}</p>
                </div>
                <button onClick={() => toggleFavorite(comp.id)} className="shrink-0 ml-2 p-1">
                  <Heart className={cn("w-3.5 h-3.5 transition-colors", favorites.has(comp.id) ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                </button>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-chart-4 fill-chart-4" /> {comp.rating}</span>
                <span className="flex items-center gap-0.5"><Download className="w-3 h-3" /> {formatDownloads(comp.downloads)}</span>
                <span>by {comp.author}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {comp.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[9px] h-4">{t}</Badge>
                ))}
              </div>

              {!comp.installed && (
                <Button size="sm" onClick={() => handleInstall(comp.id)} className="w-full gap-1 text-xs h-7">
                  <Download className="w-3 h-3" /> Install Component
                </Button>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">No components found matching your search.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
