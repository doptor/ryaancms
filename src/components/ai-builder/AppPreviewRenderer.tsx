// ============================================================
// Visual Component Renderer
// Renders actual UI previews from AI-generated AppConfig
// ============================================================

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles, Search, Bell, User, Menu, ChevronRight,
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users,
  ShoppingCart, Eye, ArrowUpRight, Lock, Mail, Github,
  Check, X, Star, Upload, Image, Calendar, GripVertical,
  Clock, MapPin, CreditCard, Settings, FileText, Shield,
  ChevronDown, Plus, MoreHorizontal, Edit, Trash2,
  LayoutGrid, Code, ExternalLink,
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
      {/* Page selector */}
      {config.pages.length > 1 && (
        <div className="border-b border-border bg-card px-3 py-2 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {config.pages.map((page, i) => (
              <button
                key={page.route}
                onClick={() => setActivePage(i)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                  i === activePage
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {page.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Page preview */}
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
        {/* Drop indicator above */}
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
            "relative cursor-pointer transition-all",
            isDragging && "opacity-30 scale-[0.98]",
            isSelected
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl"
              : "hover:ring-1 hover:ring-primary/30 hover:ring-offset-1 hover:ring-offset-background rounded-xl"
          )}
        >
          {/* Drag handle */}
          <div className={cn(
            "absolute left-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-6 h-8 rounded bg-card/80 border border-border shadow-sm cursor-grab active:cursor-grabbing transition-opacity",
            "opacity-0 group-hover:opacity-100"
          )}>
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          {isSelected && (
            <div className="absolute -top-2.5 left-9 z-10 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium">
              {comp.type.replace(/_/g, " ")}
            </div>
          )}
          <ComponentRenderer component={comp} config={config} />
        </div>
        {/* Drop indicator below */}
        {isDropTarget && dragIndex !== null && dragIndex < i && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full z-20" />
        )}
      </div>
    );
  };

  if (page.layout === "dashboard") {
    return (
      <div className="flex min-h-[600px]">
        <div className="w-56 border-r border-border bg-card p-4 space-y-4 shrink-0 hidden sm:block">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{config.title}</span>
          </div>
          {config.pages.filter(p => p.layout === "dashboard").map((p) => (
            <div key={p.route} className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
              p.route === page.route ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"
            )}>
              <LayoutGrid className="w-3.5 h-3.5" />
              {p.name}
            </div>
          ))}
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{page.name}</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8"><Bell className="w-4 h-4" /></Button>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
          {page.components.map((comp, i) => wrapComponent(comp, i))}
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
        <div className="rounded-lg border border-dashed border-border p-4 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">
            {component.type.replace(/_/g, " ")} component
          </span>
        </div>
      );
  }
}

// === Individual Component Previews ===

function NavbarPreview({ props, config }: { props: Record<string, any>; config: AppConfig }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground">{props.logo_text || config.title}</span>
        </div>
        <nav className="hidden sm:flex items-center gap-4">
          {["Home", "Features", "Pricing", "About"].map((item) => (
            <span key={item} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">{item}</span>
          ))}
        </nav>
      </div>
      {props.show_auth_buttons !== false && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs h-7">Sign In</Button>
          <Button size="sm" className="text-xs h-7">Get Started</Button>
        </div>
      )}
    </div>
  );
}

function HeroPreview({ props, config }: { props: Record<string, any>; config: AppConfig }) {
  const alignment = props.alignment || "center";
  return (
    <div className={cn(
      "px-6 py-16 bg-gradient-to-br from-primary/5 via-background to-primary/10",
      alignment === "center" ? "text-center" : "text-left"
    )}>
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
          {props.headline || config.title || "Build Something Amazing"}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
          {props.subtitle || config.description || "The modern platform for building applications faster."}
        </p>
        <div className={cn("flex gap-3 pt-2", alignment === "center" ? "justify-center" : "")}>
          <Button size="sm">{props.cta_text || "Get Started"} <ArrowUpRight className="w-3.5 h-3.5 ml-1" /></Button>
          <Button variant="outline" size="sm">Learn More</Button>
        </div>
      </div>
    </div>
  );
}

function StatsRowPreview({ props }: { props: Record<string, any> }) {
  const defaultMetrics = [
    { label: "Total Revenue", value: "$45,231", change: "+20.1%", up: true, icon: DollarSign },
    { label: "Users", value: "2,350", change: "+18.2%", up: true, icon: Users },
    { label: "Orders", value: "1,247", change: "-4.5%", up: false, icon: ShoppingCart },
    { label: "Page Views", value: "12.5K", change: "+12.3%", up: true, icon: Eye },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {defaultMetrics.map((m) => (
        <div key={m.label} className="rounded-xl border border-border bg-card p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <m.icon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold text-foreground">{m.value}</div>
          <div className={cn("text-xs flex items-center gap-1", m.up ? "text-primary" : "text-destructive")}>
            {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {m.change}
          </div>
        </div>
      ))}
    </div>
  );
}

function CrudTablePreview({ props }: { props: Record<string, any> }) {
  const collection = props.collection || "items";
  const sampleData = [
    { id: 1, name: "Item Alpha", status: "Active", date: "2024-01-15" },
    { id: 2, name: "Item Beta", status: "Pending", date: "2024-01-14" },
    { id: 3, name: "Item Gamma", status: "Active", date: "2024-01-13" },
    { id: 4, name: "Item Delta", status: "Inactive", date: "2024-01-12" },
    { id: 5, name: "Item Epsilon", status: "Active", date: "2024-01-11" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground capitalize">{collection}</h3>
        <div className="flex items-center gap-2">
          {props.searchable !== false && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="h-7 pl-8 w-40 text-xs" />
            </div>
          )}
          <Button size="sm" className="h-7 text-xs"><Plus className="w-3 h-3 mr-1" /> Add</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Name</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Date</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                <td className="px-4 py-2.5 text-xs text-foreground font-medium">{row.name}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={row.status === "Active" ? "default" : row.status === "Pending" ? "secondary" : "outline"} className="text-[10px]">
                    {row.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.date}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {props.paginated !== false && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Showing 1-5 of 24</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-6 text-xs px-2">Previous</Button>
            <Button variant="outline" size="sm" className="h-6 text-xs px-2">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartPreview({ props }: { props: Record<string, any> }) {
  const type = props.chart_type || "bar";
  const bars = [65, 40, 85, 55, 70, 90, 45, 75, 60, 80, 50, 95];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-1">{props.title || "Analytics"}</h3>
      <p className="text-xs text-muted-foreground mb-4">{type} chart visualization</p>
      <div className="h-36 flex items-end gap-1.5">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-full rounded-t-sm transition-all",
                type === "line" ? "bg-primary/30" : "bg-primary"
              )}
              style={{ height: `${h}%` }}
            />
            <span className="text-[9px] text-muted-foreground">
              {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardGridPreview({ props }: { props: Record<string, any> }) {
  const cols = props.columns || 3;
  const cards = Array.from({ length: Math.min(cols * 2, 6) }, (_, i) => ({
    title: `Card ${i + 1}`,
    desc: "A brief description of this item with relevant details.",
  }));

  return (
    <div className={cn("grid gap-3", `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(cols, 4)}`)}>
      {cards.map((card, i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
          {props.show_image !== false && (
            <div className="h-28 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          <div className="p-3 space-y-1">
            <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{card.desc}</p>
            {props.show_actions !== false && (
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="h-6 text-[10px]">View</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]">Edit</Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AuthFormPreview({ props }: { props: Record<string, any> }) {
  const mode = props.mode || "both";
  return (
    <div className="flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-foreground">{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <p className="text-xs text-muted-foreground">
            {mode === "login" ? "Sign in to your account" : "Get started with your free account"}
          </p>
        </div>
        {props.social_providers?.length > 0 && (
          <div className="space-y-2">
            <Button variant="outline" className="w-full h-9 text-xs gap-2"><Github className="w-3.5 h-3.5" /> Continue with GitHub</Button>
            <div className="relative"><Separator /><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">or</span></div>
          </div>
        )}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="you@example.com" className="h-9 text-xs pl-8" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" className="h-9 text-xs pl-8" />
            </div>
          </div>
          <Button className="w-full h-9 text-xs">{mode === "login" ? "Sign In" : "Create Account"}</Button>
        </div>
      </div>
    </div>
  );
}

function PricingTablePreview({ props }: { props: Record<string, any> }) {
  const plans = props.plans || [
    { name: "Free", price: "$0", features: ["1 project", "Basic support", "1GB storage"] },
    { name: "Pro", price: "$29", features: ["Unlimited projects", "Priority support", "100GB storage", "Custom domain"] },
    { name: "Enterprise", price: "$99", features: ["Everything in Pro", "SSO", "Dedicated support", "SLA", "Audit logs"] },
  ];
  const highlight = props.highlight_plan || "Pro";

  return (
    <div className="px-6 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Pricing</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose the right plan for your needs</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {plans.map((plan: any) => (
          <div key={plan.name} className={cn(
            "rounded-xl border p-4 space-y-3",
            plan.name === highlight ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
          )}>
            {plan.name === highlight && <Badge className="text-[10px]">Popular</Badge>}
            <h3 className="font-semibold text-foreground">{plan.name}</h3>
            <div className="text-2xl font-bold text-foreground">{plan.price}<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
            <ul className="space-y-1.5">
              {plan.features.map((f: string) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3 h-3 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button variant={plan.name === highlight ? "default" : "outline"} className="w-full h-8 text-xs">
              Get Started
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 max-w-md">
      <h3 className="text-sm font-semibold text-foreground mb-3">{props.collection ? `Add ${props.collection}` : "Form"}</h3>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Name</label>
          <Input placeholder="Enter name..." className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Email</label>
          <Input placeholder="Enter email..." className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Description</label>
          <textarea placeholder="Enter description..." rows={3} className="w-full resize-none px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <Button className="h-8 text-xs">{props.submit_label || "Submit"}</Button>
      </div>
    </div>
  );
}

function SearchBarPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="max-w-lg">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={props.placeholder || "Search..."} className="pl-10 h-9 text-xs" />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{props.keyboard_shortcut || "⌘K"}</kbd>
      </div>
    </div>
  );
}

function KanbanPreview({ props }: { props: Record<string, any> }) {
  const columns = ["To Do", "In Progress", "Done"];
  const cards = [
    [{ t: "Design homepage", p: "High" }, { t: "Write docs", p: "Medium" }],
    [{ t: "Build API", p: "High" }, { t: "Add auth", p: "High" }],
    [{ t: "Setup CI/CD", p: "Low" }],
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Kanban Board</h3>
      <div className="grid grid-cols-3 gap-3">
        {columns.map((col, ci) => (
          <div key={col} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{col}</span>
              <Badge variant="secondary" className="text-[10px] h-4">{cards[ci].length}</Badge>
            </div>
            <div className="space-y-2 min-h-[100px] bg-muted/30 rounded-lg p-2">
              {cards[ci].map((card, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-2.5 space-y-1 cursor-grab">
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-xs text-foreground font-medium">{card.t}</span>
                  </div>
                  <Badge variant={card.p === "High" ? "destructive" : card.p === "Medium" ? "secondary" : "outline"} className="text-[9px] h-4">
                    {card.p}
                  </Badge>
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
    return { day: day > 0 && day <= 31 ? day : null, hasEvent: [5, 12, 18, 25].includes(day) };
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">January 2024</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 text-xs">←</Button>
          <Button variant="ghost" size="sm" className="h-6 text-xs">→</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} className={cn(
            "text-center py-1.5 rounded-md text-xs",
            d.day ? "text-foreground hover:bg-accent cursor-pointer" : "",
            d.hasEvent ? "bg-primary/10 text-primary font-medium" : ""
          )}>
            {d.day || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaGalleryPreview({ props }: { props: Record<string, any> }) {
  const cols = props.columns || 3;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Media Gallery</h3>
      <div className={cn("grid gap-2", `grid-cols-${Math.min(cols, 4)}`)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
            <Image className="w-6 h-6 text-muted-foreground/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationPreview({ props }: { props: Record<string, any> }) {
  const items = [
    { title: "New user registered", time: "2 min ago", read: false },
    { title: "Order #1234 completed", time: "1 hour ago", read: false },
    { title: "System update available", time: "3 hours ago", read: true },
  ];
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <Button variant="ghost" size="sm" className="h-6 text-xs">Mark all read</Button>
      </div>
      {items.map((n, i) => (
        <div key={i} className={cn("flex items-center gap-3 px-4 py-3 border-b border-border last:border-0", !n.read && "bg-primary/5")}>
          {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
          {n.read && <div className="w-2 h-2 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">{n.title}</p>
            <p className="text-[10px] text-muted-foreground">{n.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelinePreview({ props }: { props: Record<string, any> }) {
  const events = [
    { title: "Project created", time: "Jan 1, 2024", desc: "Initial setup completed" },
    { title: "First release", time: "Jan 15, 2024", desc: "v1.0.0 deployed to production" },
    { title: "Milestone reached", time: "Feb 1, 2024", desc: "1,000 active users" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">Timeline</h3>
      <div className="space-y-0">
        {events.map((e, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1" />
              {i < events.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
            </div>
            <div className="pb-6">
              <p className="text-xs font-medium text-foreground">{e.title}</p>
              <p className="text-[10px] text-muted-foreground">{e.time}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{e.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FileUploadPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8">
      <div className="text-center space-y-2">
        <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm font-medium text-foreground">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground">
          {props.accept || "Images, PDFs"} · Max {props.max_size_mb || 10}MB
        </p>
        <Button variant="outline" size="sm" className="text-xs">Browse Files</Button>
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
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border flex-wrap">
        {items.map((item) => (
          <button
            key={item}
            className="px-1.5 py-1 rounded text-[10px] font-mono font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {item}
          </button>
        ))}
        {props.markdown_mode && (
          <div className="ml-auto">
            <Badge variant="outline" className="text-[9px] h-4">MD</Badge>
          </div>
        )}
      </div>
      <div className="p-4 min-h-[160px] space-y-2">
        <p className="text-sm text-foreground font-semibold">Welcome to the Editor</p>
        <p className="text-xs text-muted-foreground">
          Start typing here to create rich content. Use the toolbar above to format text, add headings, insert links, and more.
        </p>
        <p className="text-xs text-muted-foreground italic">
          This is a preview of the rich text editing experience.
        </p>
      </div>
      {props.max_length && (
        <div className="px-4 py-1.5 border-t border-border">
          <span className="text-[10px] text-muted-foreground">0 / {props.max_length} characters</span>
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Interactive Map
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-4 font-mono">{provider}</Badge>
          <span className="text-[10px] text-muted-foreground">Zoom: {zoom}</span>
        </div>
      </div>
      <div className="relative h-52 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5">
        {/* Simulated map grid */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full border-t border-foreground/20" style={{ top: `${(i + 1) * 12.5}%` }} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full border-l border-foreground/20" style={{ left: `${(i + 1) * 12.5}%` }} />
          ))}
        </div>
        {/* Markers */}
        {markers.map((m, i) => (
          <div
            key={i}
            className="absolute flex flex-col items-center group"
            style={{ left: `${20 + i * 25}%`, top: `${30 + (i % 2) * 25}%` }}
          >
            <MapPin className="w-5 h-5 text-primary drop-shadow-md" />
            <span className="text-[9px] bg-card/90 text-foreground px-1 py-0.5 rounded shadow-sm mt-0.5 font-medium">
              {m.label}
            </span>
          </div>
        ))}
        {/* Zoom controls */}
        <div className="absolute top-2 right-2 flex flex-col gap-0.5">
          <button className="w-6 h-6 rounded bg-card border border-border flex items-center justify-center text-xs text-foreground shadow-sm">+</button>
          <button className="w-6 h-6 rounded bg-card border border-border flex items-center justify-center text-xs text-foreground shadow-sm">−</button>
        </div>
        {/* Search */}
        <div className="absolute top-2 left-2 right-10">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search location..."
              className="w-full h-6 pl-6 pr-2 rounded bg-card border border-border text-[10px] text-foreground placeholder:text-muted-foreground shadow-sm"
            />
          </div>
        </div>
      </div>
      {props.markers_collection && (
        <div className="px-3 py-1.5 border-t border-border">
          <span className="text-[10px] text-muted-foreground">Data source: {props.markers_collection}</span>
        </div>
      )}
    </div>
  );
}

function RoleManagerPreview({ props }: { props: Record<string, any> }) {
  const roles = [
    { name: "Admin", users: 3, perms: ["Full Access", "Manage Users", "Billing", "Settings"] },
    { name: "Editor", users: 8, perms: ["Create Content", "Edit Content", "View Analytics"] },
    { name: "Viewer", users: 24, perms: ["View Content", "View Analytics"] },
  ];
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Roles & Permissions</h3>
        <Button size="sm" className="h-7 text-xs"><Plus className="w-3 h-3 mr-1" /> Add Role</Button>
      </div>
      <div className="divide-y divide-border">
        {roles.map((role) => (
          <div key={role.name} className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{role.name}</span>
                <Badge variant="secondary" className="text-[10px] h-4">{role.users} users</Badge>
              </div>
              <div className="flex items-center gap-1">
                {props.editable !== false && (
                  <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="w-3 h-3" /></Button>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="w-3 h-3" /></Button>
              </div>
            </div>
            {props.show_permissions !== false && (
              <div className="flex flex-wrap gap-1">
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
    <div className="max-w-lg mx-auto py-8 px-4 space-y-4">
      <h2 className="text-lg font-bold text-foreground">Checkout</h2>
      {props.show_summary !== false && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Order Summary</h3>
          <div className="space-y-1.5">
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
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Payment Details
        </h3>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Card Number</label>
          <Input placeholder="4242 4242 4242 4242" className="h-8 text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Expiry</label>
            <Input placeholder="MM/YY" className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">CVC</label>
            <Input placeholder="123" className="h-8 text-xs" />
          </div>
        </div>
        <Button className="w-full h-9 text-xs">
          <Lock className="w-3 h-3 mr-1.5" /> Pay $319
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Powered by {props.provider === "paypal" ? "PayPal" : props.provider === "manual" ? "Manual" : "Stripe"}
        </p>
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
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Settings className="w-4 h-4" /> Settings
        </h3>
        <Button size="sm" className="h-7 text-xs">Save Changes</Button>
      </div>
      <div className="divide-y divide-border">
        {sections.map((section: any) => (
          <div key={section.title} className="px-4 py-4 space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">{section.title}</h4>
            {(section.fields || []).map((field: string) => (
              <div key={field} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{field}</span>
                {field.includes("Auth") || field.includes("Notification") || field.includes("Alert") || field.includes("Digest") ? (
                  <div className="w-8 h-4 rounded-full bg-primary/20 relative cursor-pointer">
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-primary transition-all" />
                  </div>
                ) : (
                  <Input placeholder={field} className="h-7 text-xs w-40" />
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
    GET: "bg-primary/10 text-primary",
    POST: "bg-green-500/10 text-green-600",
    PUT: "bg-amber-500/10 text-amber-600",
    DELETE: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Code className="w-4 h-4" /> API Documentation
        </h3>
        {props.base_url && <Badge variant="outline" className="text-[10px] font-mono">{props.base_url}</Badge>}
      </div>
      <div className="divide-y divide-border">
        {endpoints.map((ep, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-accent/50">
            <Badge className={cn("text-[10px] font-mono w-14 justify-center", methodColor[ep.method] || "")} variant="secondary">
              {ep.method}
            </Badge>
            <code className="text-xs text-foreground font-mono flex-1">{ep.path}</code>
            <span className="text-xs text-muted-foreground hidden sm:inline">{ep.desc}</span>
            {props.show_try_it !== false && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] shrink-0">Try It</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="px-6 py-8 border-t border-border bg-card mt-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
        {["Product", "Company", "Resources", "Legal"].map((section) => (
          <div key={section} className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground">{section}</h4>
            {["Link 1", "Link 2", "Link 3"].map((link) => (
              <p key={link} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">{link}</p>
            ))}
          </div>
        ))}
      </div>
      <Separator className="mb-4" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">© 2024 All rights reserved.</span>
        {props.show_social !== false && (
          <div className="flex items-center gap-3">
            <Github className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
          </div>
        )}
      </div>
    </div>
  );
}
