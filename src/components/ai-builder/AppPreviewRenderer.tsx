// ============================================================
// Visual Component Renderer — Polished UI Previews
// Renders actual UI previews from AI-generated AppConfig
// ============================================================

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, Search, Bell, User, Menu, ChevronRight,
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users,
  ShoppingCart, Eye, ArrowUpRight, Lock, Mail, Github,
  Check, X, Star, Upload, Image, Calendar, GripVertical,
  Clock, MapPin, CreditCard, Settings, FileText, Shield,
  ChevronDown, Plus, MoreHorizontal, Edit, Trash2,
  LayoutGrid, Code, ExternalLink, Zap, Globe, Heart,
  Package, Activity, ArrowRight, Play, Hash, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppConfig, PageConfig, ComponentConfig } from "@/lib/engine";
import { useState, useRef, useCallback } from "react";

// === Main Renderer ===

interface AppPreviewRendererProps {
  config: AppConfig;
  selectedComponent?: { pageIndex: number; componentIndex: number } | null;
  onSelectComponent?: (pageIndex: number, componentIndex: number) => void;
  onReorderComponents?: (pageIndex: number, fromIndex: number, toIndex: number) => void;
}

export function AppPreviewRenderer({ config, selectedComponent, onSelectComponent, onReorderComponents }: AppPreviewRendererProps) {
  const [activePage, setActivePage] = useState(0);
  const currentPage = config.pages[activePage];

  return (
    <div className="flex flex-col h-full">
      {config.pages.length > 1 && (
        <div className="border-b border-border bg-card px-3 py-2 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {config.pages.map((page, i) => (
              <button
                key={page.route}
                onClick={() => setActivePage(i)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200",
                  i === activePage
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {page.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="bg-background min-h-full">
          {currentPage && (
            <PageRenderer
              page={currentPage}
              config={config}
              pageIndex={activePage}
              selectedComponent={selectedComponent}
              onSelectComponent={onSelectComponent}
              onReorderComponents={onReorderComponents}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// === Page Renderer ===

interface PageRendererProps {
  page: PageConfig;
  config: AppConfig;
  pageIndex: number;
  selectedComponent?: { pageIndex: number; componentIndex: number } | null;
  onSelectComponent?: (pageIndex: number, componentIndex: number) => void;
  onReorderComponents?: (pageIndex: number, fromIndex: number, toIndex: number) => void;
}

function PageRenderer({ page, config, pageIndex, selectedComponent, onSelectComponent, onReorderComponents }: PageRendererProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropIndex(null);
    dragCounter.current = 0;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnterZone = useCallback((index: number) => {
    setDropIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      onReorderComponents?.(pageIndex, fromIndex, toIndex);
    }
    setDragIndex(null);
    setDropIndex(null);
    dragCounter.current = 0;
  }, [pageIndex, onReorderComponents]);

  const wrapComponent = (comp: ComponentConfig, i: number) => {
    const isSelected = selectedComponent?.pageIndex === pageIndex && selectedComponent?.componentIndex === i;
    const isDragging = dragIndex === i;
    const isDropTarget = dropIndex === i && dragIndex !== i;

    return (
      <div key={i} className="relative group">
        {isDropTarget && dragIndex !== null && dragIndex > i && (
          <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-20" />
        )}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, i)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragEnter={() => handleDragEnterZone(i)}
          onDrop={(e) => handleDrop(e, i)}
          onClick={(e) => { e.stopPropagation(); onSelectComponent?.(pageIndex, i); }}
          className={cn(
            "relative cursor-pointer transition-all duration-200",
            isDragging && "opacity-30 scale-[0.98]",
            isSelected
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl"
              : "hover:ring-1 hover:ring-primary/30 hover:ring-offset-1 hover:ring-offset-background rounded-xl"
          )}
        >
          <div className={cn(
            "absolute left-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-6 h-8 rounded bg-card/80 border border-border shadow-sm cursor-grab active:cursor-grabbing transition-opacity",
            "opacity-0 group-hover:opacity-100"
          )}>
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          {isSelected && (
            <div className="absolute -top-2.5 left-9 z-10 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium shadow-sm">
              {comp.type.replace(/_/g, " ")}
            </div>
          )}
          <ComponentRenderer component={comp} config={config} />
        </div>
        {isDropTarget && dragIndex !== null && dragIndex < i && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full z-20" />
        )}
      </div>
    );
  };

  if (page.layout === "dashboard") {
    return (
      <div className="flex min-h-[600px]">
        {/* Enhanced Sidebar */}
        <div className="w-60 border-r border-border bg-card p-0 shrink-0 hidden sm:flex flex-col">
          <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight">{config.title}</span>
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {config.pages.filter(p => p.layout === "dashboard").map((p, idx) => (
              <div key={p.route} className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-all duration-200",
                p.route === page.route
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}>
                <LayoutGrid className="w-3.5 h-3.5" />
                {p.name}
                {p.route === page.route && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">Admin User</p>
                <p className="text-[10px] text-muted-foreground truncate">admin@app.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 h-14 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-foreground">{page.name}</h2>
              <Badge variant="secondary" className="text-[10px] h-5 font-normal">
                {page.components.length} components
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." className="h-8 pl-8 w-44 text-xs bg-muted/50 border-0 focus-visible:ring-1" />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-sm">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </div>
          <div className="flex-1 p-5 space-y-5 overflow-auto">
            {page.components.map((comp, i) => wrapComponent(comp, i))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {page.components.map((comp, i) => wrapComponent(comp, i))}
    </div>
  );
}

// === Component Renderer ===

function ComponentRenderer({ component, config }: { component: ComponentConfig; config: AppConfig }) {
  const props = component.props || {};

  switch (component.type) {
    case "hero": return <HeroPreview props={props} config={config} />;
    case "navbar": return <NavbarPreview props={props} config={config} />;
    case "footer": return <FooterPreview props={props} />;
    case "stats_row": return <StatsRowPreview props={props} />;
    case "crud_table": return <CrudTablePreview props={props} />;
    case "chart": return <ChartPreview props={props} />;
    case "card_grid": return <CardGridPreview props={props} />;
    case "auth_form": return <AuthFormPreview props={props} />;
    case "pricing_table": return <PricingTablePreview props={props} />;
    case "form": return <FormPreview props={props} />;
    case "search_bar": return <SearchBarPreview props={props} />;
    case "kanban_board": return <KanbanPreview props={props} />;
    case "calendar": return <CalendarPreview props={props} />;
    case "media_gallery": return <MediaGalleryPreview props={props} />;
    case "notification_center": return <NotificationPreview props={props} />;
    case "timeline": return <TimelinePreview props={props} />;
    case "file_upload": return <FileUploadPreview props={props} />;
    case "role_manager": return <RoleManagerPreview props={props} />;
    case "payment_page": return <PaymentPagePreview props={props} />;
    case "settings_panel": return <SettingsPanelPreview props={props} />;
    case "api_docs": return <ApiDocsPreview props={props} />;
    case "rich_text_editor": return <RichTextEditorPreview props={props} />;
    case "map": return <MapPreview props={props} />;
    case "sidebar": return null;
    case "dashboard_layout": return null;
    default:
      return (
        <div className="rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/20">
          <div className="text-center space-y-1">
            <Package className="w-6 h-6 text-muted-foreground/40 mx-auto" />
            <span className="text-xs text-muted-foreground">
              {component.type.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      );
  }
}

// === Individual Component Previews ===

function NavbarPreview({ props, config }: { props: Record<string, any>; config: AppConfig }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-foreground tracking-tight">{props.logo_text || config.title}</span>
        </div>
        <nav className="hidden sm:flex items-center gap-1">
          {["Home", "Features", "Pricing", "About"].map((item, i) => (
            <button key={item} className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              i === 0 ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}>
              {item}
            </button>
          ))}
        </nav>
      </div>
      {props.show_auth_buttons !== false && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs h-8">Sign In</Button>
          <Button size="sm" className="text-xs h-8 shadow-sm">
            Get Started <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

function HeroPreview({ props, config }: { props: Record<string, any>; config: AppConfig }) {
  const alignment = props.alignment || "center";
  return (
    <div className={cn(
      "relative px-6 py-20 overflow-hidden",
      alignment === "center" ? "text-center" : "text-left"
    )}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-2xl mx-auto space-y-6">
        <Badge variant="secondary" className="text-xs px-3 py-1 gap-1.5 font-medium">
          <Sparkles className="w-3 h-3" /> {props.badge_text || "New Release"}
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
          {props.headline || config.title || "Build Something Amazing"}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          {props.subtitle || config.description || "The modern platform for building applications faster than ever before."}
        </p>
        <div className={cn("flex gap-3 pt-2", alignment === "center" ? "justify-center" : "")}>
          <Button variant="hero" size="lg" className="text-sm gap-2 shadow-primary-lg">
            {props.cta_text || "Get Started"} <ArrowUpRight className="w-4 h-4" />
          </Button>
          <Button variant="hero-outline" size="lg" className="text-sm gap-2">
            <Play className="w-4 h-4" /> Watch Demo
          </Button>
        </div>
        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-background bg-gradient-primary flex items-center justify-center">
                <span className="text-[9px] text-primary-foreground font-bold">{String.fromCharCode(65 + i)}</span>
              </div>
            ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Trusted by 2,000+ teams</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsRowPreview({ props }: { props: Record<string, any> }) {
  const defaultMetrics = [
    { label: "Total Revenue", value: "$45,231", change: "+20.1%", up: true, icon: DollarSign, color: "text-primary" },
    { label: "Active Users", value: "2,350", change: "+18.2%", up: true, icon: Users, color: "text-primary" },
    { label: "Orders", value: "1,247", change: "-4.5%", up: false, icon: ShoppingCart, color: "text-destructive" },
    { label: "Conversion", value: "3.24%", change: "+12.3%", up: true, icon: Activity, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {defaultMetrics.map((m) => (
        <div key={m.label} className="rounded-xl border border-border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <m.icon className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground tracking-tight">{m.value}</div>
            <div className={cn("text-xs flex items-center gap-1 mt-1 font-medium", m.up ? "text-primary" : "text-destructive")}>
              {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {m.change} <span className="text-muted-foreground font-normal">vs last month</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CrudTablePreview({ props }: { props: Record<string, any> }) {
  const collection = props.collection || "items";
  const sampleData = [
    { id: 1, name: "Sarah Johnson", status: "Active", date: "Jan 15, 2024", email: "sarah@example.com" },
    { id: 2, name: "Michael Chen", status: "Pending", date: "Jan 14, 2024", email: "michael@example.com" },
    { id: 3, name: "Emma Williams", status: "Active", date: "Jan 13, 2024", email: "emma@example.com" },
    { id: 4, name: "James Brown", status: "Inactive", date: "Jan 12, 2024", email: "james@example.com" },
    { id: 5, name: "Olivia Davis", status: "Active", date: "Jan 11, 2024", email: "olivia@example.com" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-foreground capitalize">{collection}</h3>
          <Badge variant="secondary" className="text-[10px] h-5 font-normal">{sampleData.length} records</Badge>
        </div>
        <div className="flex items-center gap-2">
          {props.searchable !== false && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="h-8 pl-8 w-44 text-xs bg-muted/50 border-0 focus-visible:ring-1" />
            </div>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Filter className="w-3 h-3" /> Filter
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm">
            <Plus className="w-3 h-3" /> Add New
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-2.5 uppercase tracking-wider">Name</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-2.5 uppercase tracking-wider">Email</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-2.5 uppercase tracking-wider">Status</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-2.5 uppercase tracking-wider">Date</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground px-5 py-2.5 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary-foreground">{row.name.charAt(0)}</span>
                    </div>
                    <span className="text-xs text-foreground font-medium">{row.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{row.email}</td>
                <td className="px-5 py-3">
                  <Badge
                    variant={row.status === "Active" ? "default" : row.status === "Pending" ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px] font-medium",
                      row.status === "Active" && "bg-primary/10 text-primary border-primary/20",
                      row.status === "Inactive" && "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full mr-1",
                      row.status === "Active" ? "bg-primary" : row.status === "Pending" ? "bg-yellow-500" : "bg-muted-foreground"
                    )} />
                    {row.status}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{row.date}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent"><Edit className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3 h-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {props.paginated !== false && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">Showing 1-5 of 24 results</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">← Prev</Button>
            {[1, 2, 3].map((p) => (
              <Button key={p} variant={p === 1 ? "default" : "outline"} size="sm" className="h-7 w-7 text-xs p-0">{p}</Button>
            ))}
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">Next →</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartPreview({ props }: { props: Record<string, any> }) {
  const type = props.chart_type || "bar";
  const bars = [45, 65, 40, 85, 55, 70, 90, 45, 75, 60, 80, 95];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">{props.title || "Revenue Analytics"}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Monthly performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] h-5 gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> +12.5%
          </Badge>
          <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
        </div>
      </div>
      <div className="h-40 flex items-end gap-2 px-1">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full relative group">
              <div
                className={cn(
                  "w-full rounded-t-md transition-all duration-500 cursor-pointer group-hover:opacity-80",
                  type === "line"
                    ? "bg-primary/20 border-t-2 border-primary"
                    : "bg-gradient-to-t from-primary/60 to-primary"
                )}
                style={{ height: `${h}%`, minHeight: "4px" }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                ${Math.round(h * 50)}
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardGridPreview({ props }: { props: Record<string, any> }) {
  const cols = props.columns || 3;
  const cards = [
    { title: "Getting Started", desc: "Quick setup guide to launch your first project in minutes.", icon: Zap },
    { title: "API Reference", desc: "Complete API documentation with code examples and guides.", icon: Code },
    { title: "Templates", desc: "Browse curated templates for common use cases and patterns.", icon: LayoutGrid },
    { title: "Community", desc: "Join our community of builders and share your creations.", icon: Users },
    { title: "Analytics", desc: "Track performance metrics and gain insights into user behavior.", icon: BarChart3 },
    { title: "Security", desc: "Enterprise-grade security with built-in compliance features.", icon: Shield },
  ].slice(0, Math.min(cols * 2, 6));

  return (
    <div className={cn("grid gap-4", `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(cols, 4)}`)}>
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-300 group cursor-pointer">
            {props.show_image !== false && (
              <div className="h-32 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className="w-10 h-10 text-primary/30 group-hover:text-primary/50 transition-colors" />
              </div>
            )}
            <div className="p-4 space-y-2">
              <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{card.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{card.desc}</p>
              {props.show_actions !== false && (
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                    Learn More <ArrowRight className="w-2.5 h-2.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AuthFormPreview({ props }: { props: Record<string, any> }) {
  const mode = props.mode || "both";
  return (
    <div className="flex items-center justify-center py-16 px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary-lg mb-4">
            <Lock className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <p className="text-xs text-muted-foreground">
            {mode === "login" ? "Sign in to continue to your dashboard" : "Get started with your free account today"}
          </p>
        </div>
        {props.social_providers?.length > 0 && (
          <div className="space-y-2.5">
            <Button variant="outline" className="w-full h-10 text-xs gap-2 hover:bg-accent">
              <Github className="w-4 h-4" /> Continue with GitHub
            </Button>
            <div className="relative">
              <Separator />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="you@example.com" className="h-10 text-xs pl-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Password</label>
              {mode === "login" && <button className="text-[10px] text-primary hover:underline">Forgot?</button>}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" className="h-10 text-xs pl-10" />
            </div>
          </div>
          <Button variant="hero" className="w-full h-10 text-xs shadow-primary-lg">
            {mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button className="text-primary font-medium hover:underline">
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function PricingTablePreview({ props }: { props: Record<string, any> }) {
  const plans = props.plans || [
    { name: "Starter", price: "$0", features: ["1 project", "Basic analytics", "1GB storage", "Community support"] },
    { name: "Pro", price: "$29", features: ["Unlimited projects", "Advanced analytics", "100GB storage", "Priority support", "Custom domain", "API access"] },
    { name: "Enterprise", price: "$99", features: ["Everything in Pro", "SSO & SAML", "Dedicated support", "99.9% SLA", "Audit logs", "Custom integrations"] },
  ];
  const highlight = props.highlight_plan || "Pro";

  return (
    <div className="px-6 py-16">
      <div className="text-center mb-10 space-y-2">
        <Badge variant="secondary" className="text-xs px-3 py-1 mb-2">Pricing</Badge>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Simple, transparent pricing</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Choose the plan that's right for you. Upgrade or downgrade anytime.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
        {plans.map((plan: any) => (
          <div key={plan.name} className={cn(
            "rounded-2xl border p-5 space-y-4 relative transition-all duration-300",
            plan.name === highlight
              ? "border-primary bg-primary/5 shadow-primary-lg scale-[1.02]"
              : "border-border bg-card hover:shadow-sm hover:border-primary/20"
          )}>
            {plan.name === highlight && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] shadow-sm">
                Most Popular
              </Badge>
            )}
            <div>
              <h3 className="font-bold text-foreground">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-extrabold text-foreground tracking-tight">{plan.price}</span>
                <span className="text-xs text-muted-foreground font-normal">/month</span>
              </div>
            </div>
            <ul className="space-y-2.5">
              {plan.features.map((f: string) => (
                <li key={f} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.name === highlight ? "hero" : "outline"}
              className={cn("w-full h-9 text-xs", plan.name === highlight && "shadow-primary-lg")}
            >
              Get Started <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 max-w-md">
      <h3 className="text-sm font-bold text-foreground mb-1">{props.collection ? `Add ${props.collection}` : "Create New"}</h3>
      <p className="text-xs text-muted-foreground mb-4">Fill in the details below to create a new entry.</p>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Name</label>
          <Input placeholder="Enter name..." className="h-9 text-xs" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Email</label>
          <Input placeholder="Enter email..." className="h-9 text-xs" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Description</label>
          <textarea placeholder="Enter description..." rows={3} className="w-full resize-none px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-2 pt-1">
          <Button className="h-9 text-xs gap-1.5 shadow-sm">
            <Check className="w-3 h-3" /> {props.submit_label || "Submit"}
          </Button>
          <Button variant="outline" className="h-9 text-xs">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function SearchBarPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="max-w-lg">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={props.placeholder || "Search anything..."} className="pl-10 pr-16 h-10 text-xs rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:bg-background" />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border font-mono">{props.keyboard_shortcut || "⌘K"}</kbd>
      </div>
    </div>
  );
}

function KanbanPreview({ props }: { props: Record<string, any> }) {
  const columns = [
    { name: "To Do", color: "bg-muted-foreground", items: [{ t: "Design homepage", p: "High", tag: "Design" }, { t: "Write documentation", p: "Medium", tag: "Docs" }] },
    { name: "In Progress", color: "bg-primary", items: [{ t: "Build REST API", p: "High", tag: "Backend" }, { t: "Add authentication", p: "High", tag: "Auth" }] },
    { name: "Done", color: "bg-primary", items: [{ t: "Setup CI/CD pipeline", p: "Low", tag: "DevOps" }] },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Project Board</h3>
        <Button size="sm" className="h-7 text-xs gap-1"><Plus className="w-3 h-3" /> Add Task</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.name} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", col.color)} />
                <span className="text-xs font-semibold text-foreground">{col.name}</span>
              </div>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{col.items.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[120px] bg-muted/20 rounded-lg p-2">
              {col.items.map((card, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2 cursor-grab hover:shadow-sm hover:border-primary/20 transition-all">
                  <span className="text-xs text-foreground font-medium block">{card.t}</span>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal">{card.tag}</Badge>
                    <Badge
                      variant={card.p === "High" ? "destructive" : card.p === "Medium" ? "secondary" : "outline"}
                      className="text-[9px] h-4 px-1.5"
                    >
                      {card.p}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarPreview({ props }: { props: Record<string, any> }) {
  const days = Array.from({ length: 35 }, (_, i) => {
    const day = i - 3;
    return { day: day > 0 && day <= 31 ? day : null, hasEvent: [5, 12, 18, 25].includes(day), isToday: day === 15 };
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">January 2024</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0">←</Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0">→</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} className={cn(
            "text-center py-2 rounded-lg text-xs transition-colors cursor-pointer",
            d.day ? "hover:bg-accent" : "",
            d.isToday ? "bg-primary text-primary-foreground font-bold" : "",
            d.hasEvent && !d.isToday ? "bg-primary/10 text-primary font-medium" : d.day ? "text-foreground" : ""
          )}>
            {d.day || ""}
            {d.hasEvent && !d.isToday && <div className="w-1 h-1 rounded-full bg-primary mx-auto mt-0.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaGalleryPreview({ props }: { props: Record<string, any> }) {
  const cols = props.columns || 3;
  const gradients = [
    "from-primary/20 to-accent/10",
    "from-accent/20 to-primary/10",
    "from-primary/10 to-primary/20",
    "from-accent/10 to-accent/20",
    "from-primary/15 to-accent/15",
    "from-accent/15 to-primary/15",
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Media Gallery</h3>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Upload className="w-3 h-3" /> Upload</Button>
      </div>
      <div className={cn("grid gap-2.5", `grid-cols-${Math.min(cols, 4)}`)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(
            "aspect-square rounded-xl bg-gradient-to-br flex items-center justify-center cursor-pointer",
            "hover:ring-2 hover:ring-primary/30 hover:scale-[1.02] transition-all duration-200",
            gradients[i]
          )}>
            <Image className="w-6 h-6 text-muted-foreground/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationPreview({ props }: { props: Record<string, any> }) {
  const items = [
    { title: "New user registered", time: "2 min ago", read: false, icon: Users },
    { title: "Order #1234 completed", time: "1 hour ago", read: false, icon: ShoppingCart },
    { title: "System update available", time: "3 hours ago", read: true, icon: Globe },
    { title: "Weekly report ready", time: "Yesterday", read: true, icon: BarChart3 },
  ];
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">Notifications</h3>
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">2 new</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">Mark all read</Button>
      </div>
      {items.map((n, i) => {
        const Icon = n.icon;
        return (
          <div key={i} className={cn(
            "flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 hover:bg-accent/30 transition-colors cursor-pointer",
            !n.read && "bg-primary/5"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              !n.read ? "bg-primary/10" : "bg-muted"
            )}>
              <Icon className={cn("w-4 h-4", !n.read ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-medium", !n.read ? "text-foreground" : "text-muted-foreground")}>{n.title}</p>
              <p className="text-[10px] text-muted-foreground">{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

function TimelinePreview({ props }: { props: Record<string, any> }) {
  const events = [
    { title: "Project created", time: "Jan 1, 2024", desc: "Initial setup and configuration completed", icon: Zap },
    { title: "First release", time: "Jan 15, 2024", desc: "v1.0.0 deployed to production environment", icon: Package },
    { title: "Milestone reached", time: "Feb 1, 2024", desc: "1,000 active users milestone achieved", icon: Star },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground mb-5">Activity Timeline</h3>
      <div className="space-y-0">
        {events.map((e, i) => {
          const Icon = e.icon;
          return (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                {i < events.length - 1 && <div className="w-0.5 flex-1 bg-border my-1" />}
              </div>
              <div className="pb-6 pt-1">
                <p className="text-xs font-semibold text-foreground">{e.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{e.time}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{e.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FileUploadPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-10 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-pointer">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Drop files here or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">
            {props.accept || "Images, PDFs"} · Max {props.max_size_mb || 10}MB per file
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Upload className="w-3 h-3" /> Browse Files
        </Button>
      </div>
    </div>
  );
}

function RichTextEditorPreview({ props }: { props: Record<string, any> }) {
  const toolbar = props.toolbar || "standard";
  const toolbarItems: Record<string, string[]> = {
    minimal: ["B", "I", "U", "Link"],
    standard: ["B", "I", "U", "S", "Link", "H1", "H2", "List", "Quote", "Code"],
    full: ["B", "I", "U", "S", "Link", "H1", "H2", "H3", "List", "OL", "Quote", "Code", "Image", "Table", "HR"],
  };
  const items = toolbarItems[toolbar] || toolbarItems.standard;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/20 flex-wrap">
        {items.map((item) => (
          <button
            key={item}
            className="px-2 py-1 rounded-md text-[10px] font-mono font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {item}
          </button>
        ))}
        {props.markdown_mode && (
          <div className="ml-auto">
            <Badge variant="outline" className="text-[9px] h-4 gap-0.5"><Hash className="w-2.5 h-2.5" /> MD</Badge>
          </div>
        )}
      </div>
      <div className="p-5 min-h-[160px] space-y-3">
        <p className="text-sm text-foreground font-bold">Welcome to the Editor</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Start typing here to create rich content. Use the toolbar above to format text, add headings, insert links, and more.
        </p>
        <p className="text-xs text-muted-foreground italic">
          This is a preview of the rich text editing experience.
        </p>
      </div>
      {props.max_length && (
        <div className="px-5 py-2 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">0 / {props.max_length} characters</span>
            <Progress value={0} className="w-20 h-1" />
          </div>
        </div>
      )}
    </div>
  );
}

function MapPreview({ props }: { props: Record<string, any> }) {
  const provider = props.provider || "leaflet";
  const zoom = props.zoom || 10;
  const markers = [
    { lat: 40.7128, lng: -74.006, label: "New York" },
    { lat: 40.7589, lng: -73.9851, label: "Times Square" },
    { lat: 40.6892, lng: -74.0445, label: "Statue of Liberty" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Interactive Map
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-5 font-mono">{provider}</Badge>
          <span className="text-[10px] text-muted-foreground">Zoom: {zoom}</span>
        </div>
      </div>
      <div className="relative h-52 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full border-t border-foreground/20" style={{ top: `${(i + 1) * 12.5}%` }} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full border-l border-foreground/20" style={{ left: `${(i + 1) * 12.5}%` }} />
          ))}
        </div>
        {markers.map((m, i) => (
          <div key={i} className="absolute flex flex-col items-center group" style={{ left: `${20 + i * 25}%`, top: `${30 + (i % 2) * 25}%` }}>
            <MapPin className="w-5 h-5 text-primary drop-shadow-md" />
            <span className="text-[9px] bg-card/90 text-foreground px-1.5 py-0.5 rounded-md shadow-sm mt-0.5 font-medium border border-border">
              {m.label}
            </span>
          </div>
        ))}
        <div className="absolute top-2 right-2 flex flex-col gap-0.5">
          <button className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-xs text-foreground shadow-sm hover:bg-accent">+</button>
          <button className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-xs text-foreground shadow-sm hover:bg-accent">−</button>
        </div>
        <div className="absolute top-2 left-2 right-12">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search location..." className="w-full h-7 pl-7 pr-2 rounded-lg bg-card border border-border text-[10px] text-foreground placeholder:text-muted-foreground shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleManagerPreview({ props }: { props: Record<string, any> }) {
  const roles = [
    { name: "Admin", users: 3, perms: ["Full Access", "Manage Users", "Billing", "Settings"], color: "bg-destructive/10 text-destructive" },
    { name: "Editor", users: 8, perms: ["Create Content", "Edit Content", "View Analytics"], color: "bg-primary/10 text-primary" },
    { name: "Viewer", users: 24, perms: ["View Content", "View Analytics"], color: "bg-muted text-muted-foreground" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Roles & Permissions
        </h3>
        <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm"><Plus className="w-3 h-3" /> Add Role</Button>
      </div>
      <div className="divide-y divide-border">
        {roles.map((role) => (
          <div key={role.name} className="px-5 py-4 space-y-2.5 hover:bg-accent/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">{role.name}</span>
                  <Badge variant="secondary" className="text-[10px] h-4 ml-2">{role.users} users</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {props.editable !== false && (
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3 h-3" /></Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3 h-3" /></Button>
              </div>
            </div>
            {props.show_permissions !== false && (
              <div className="flex flex-wrap gap-1.5 pl-10">
                {role.perms.map((p) => (
                  <Badge key={p} variant="outline" className="text-[10px] h-5 font-normal">{p}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentPagePreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="max-w-lg mx-auto py-10 px-4 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Checkout</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Complete your purchase securely</p>
      </div>
      {props.show_summary !== false && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Order Summary</h3>
          <div className="space-y-2">
            {[{ item: "Pro Plan (Annual)", price: "$290" }, { item: "Tax", price: "$29" }].map((row) => (
              <div key={row.item} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{row.item}</span>
                <span className="text-foreground font-medium">{row.price}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">$319</span>
            </div>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" /> Payment Details
        </h3>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Card Number</label>
          <Input placeholder="4242 4242 4242 4242" className="h-9 text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Expiry</label>
            <Input placeholder="MM/YY" className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">CVC</label>
            <Input placeholder="123" className="h-9 text-xs" />
          </div>
        </div>
        <Button variant="hero" className="w-full h-10 text-xs gap-1.5 shadow-primary-lg">
          <Lock className="w-3.5 h-3.5" /> Pay $319
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Shield className="w-3 h-3" />
          Secured by {props.provider === "paypal" ? "PayPal" : props.provider === "manual" ? "Manual" : "Stripe"}
        </div>
      </div>
    </div>
  );
}

function SettingsPanelPreview({ props }: { props: Record<string, any> }) {
  const sections = props.sections || [
    { title: "General", fields: ["Site Name", "Description", "Language"] },
    { title: "Notifications", fields: ["Email Alerts", "Push Notifications", "Weekly Digest"] },
    { title: "Security", fields: ["Two-Factor Auth", "Session Timeout", "IP Whitelist"] },
  ];
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" /> Settings
        </h3>
        <Button size="sm" className="h-8 text-xs shadow-sm">Save Changes</Button>
      </div>
      <div className="divide-y divide-border">
        {sections.map((section: any) => (
          <div key={section.title} className="px-5 py-5 space-y-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{section.title}</h4>
            {(section.fields || []).map((field: string) => (
              <div key={field} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{field}</span>
                {field.includes("Auth") || field.includes("Notification") || field.includes("Alert") || field.includes("Digest") ? (
                  <div className="w-9 h-5 rounded-full bg-primary relative cursor-pointer shadow-sm">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-all shadow-sm" />
                  </div>
                ) : (
                  <Input placeholder={field} className="h-8 text-xs w-44" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiDocsPreview({ props }: { props: Record<string, any> }) {
  const endpoints = [
    { method: "GET", path: "/api/users", desc: "List all users", status: "200" },
    { method: "POST", path: "/api/users", desc: "Create a user", status: "201" },
    { method: "GET", path: "/api/users/:id", desc: "Get user by ID", status: "200" },
    { method: "PUT", path: "/api/users/:id", desc: "Update a user", status: "200" },
    { method: "DELETE", path: "/api/users/:id", desc: "Delete a user", status: "204" },
  ];
  const methodColor: Record<string, string> = {
    GET: "bg-primary/10 text-primary border-primary/20",
    POST: "bg-green-500/10 text-green-600 border-green-500/20",
    PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" /> API Documentation
        </h3>
        {props.base_url && <Badge variant="outline" className="text-[10px] font-mono h-5">{props.base_url}</Badge>}
      </div>
      <div className="divide-y divide-border">
        {endpoints.map((ep, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-accent/20 transition-colors cursor-pointer group">
            <Badge className={cn("text-[10px] font-mono w-16 justify-center h-5 border", methodColor[ep.method] || "")} variant="secondary">
              {ep.method}
            </Badge>
            <code className="text-xs text-foreground font-mono flex-1 font-medium">{ep.path}</code>
            <span className="text-xs text-muted-foreground hidden sm:inline">{ep.desc}</span>
            {props.show_try_it !== false && (
              <Button variant="outline" size="sm" className="h-6 text-[10px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                <Play className="w-2.5 h-2.5" /> Try It
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="px-6 py-10 border-t border-border bg-card mt-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
        {["Product", "Company", "Resources", "Legal"].map((section) => (
          <div key={section} className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{section}</h4>
            {["Overview", "Features", "Support"].map((link) => (
              <p key={link} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{link}</p>
            ))}
          </div>
        ))}
      </div>
      <Separator className="mb-6" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">© 2024 All rights reserved.</span>
        </div>
        {props.show_social !== false && (
          <div className="flex items-center gap-2">
            {[Github, Globe, Heart].map((Icon, i) => (
              <button key={i} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
                <Icon className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
