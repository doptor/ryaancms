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
  Sparkles, Search, Bell, User, Menu, ChevronRight, Send,
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users,
  ShoppingCart, Eye, ArrowUpRight, Lock, Mail, Github,
  Check, X, Star, Upload, Image, Calendar, GripVertical,
  Clock, MapPin, CreditCard, Settings, FileText, Shield,
  ChevronDown, Plus, MoreHorizontal, Edit, Trash2, Copy, ChevronUp,
  LayoutGrid, Code, ExternalLink, Zap, Globe, Heart,
  Package, Activity, ArrowRight, Play, Hash, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppConfig, PageConfig, ComponentConfig } from "@/lib/engine";
import { useState, useRef, useCallback } from "react";
import { EditableText, EditableImage, EditableLink } from "./InlineEditable";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

// Prop updater type threaded through components
type PropUpdater = (key: string, value: any) => void;

// === Main Renderer ===

interface AppPreviewRendererProps {
  config: AppConfig;
  selectedComponent?: { pageIndex: number; componentIndex: number } | null;
  onSelectComponent?: (pageIndex: number, componentIndex: number) => void;
  onReorderComponents?: (pageIndex: number, fromIndex: number, toIndex: number) => void;
  onDeleteComponent?: (pageIndex: number, componentIndex: number) => void;
  onAddComponent?: (pageIndex: number, type: string) => void;
  onAddPage?: (name: string, route: string, layout: string) => void;
  onDeletePage?: (pageIndex: number) => void;
  onUpdateComponentProp?: (pageIndex: number, componentIndex: number, propKey: string, value: any) => void;
  onDuplicateComponent?: (pageIndex: number, componentIndex: number) => void;
  multiSelectedComponents?: Set<string>;
  onMultiSelectComponent?: (pageIndex: number, componentIndex: number, add: boolean) => void;
}

export function AppPreviewRenderer({ config, selectedComponent, onSelectComponent, onReorderComponents, onDeleteComponent, onAddComponent, onAddPage, onDeletePage, onUpdateComponentProp, onDuplicateComponent, multiSelectedComponents, onMultiSelectComponent }: AppPreviewRendererProps) {
  const [activePage, setActivePage] = useState(0);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const currentPage = config.pages[activePage];

  const navigateToPage = useCallback((pageRoute: string) => {
    const idx = config.pages.findIndex(p => p.route === pageRoute || p.name.toLowerCase() === pageRoute.toLowerCase());
    if (idx >= 0) setActivePage(idx);
  }, [config.pages]);

  const COMPONENT_TYPES = [
    "hero", "navbar", "footer", "stats_row", "crud_table", "chart", "card_grid",
    "auth_form", "pricing_table", "form", "search_bar", "kanban_board", "calendar",
    "media_gallery", "timeline", "file_upload", "testimonials", "faq", "features_grid",
    "contact_form", "newsletter_cta", "blog_preview", "team_section",
  ];

  return (
    <div className="flex flex-col h-full">

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
              onDeleteComponent={onDeleteComponent}
              onDuplicateComponent={onDuplicateComponent}
              onNavigate={navigateToPage}
              onUpdateComponentProp={onUpdateComponentProp}
              multiSelectedComponents={multiSelectedComponents}
              onMultiSelectComponent={onMultiSelectComponent}
            />
          )}

          {/* Add component button */}
          {onAddComponent && currentPage && (
            <div className="p-4">
              {showAddComponent ? (
                <div className="rounded-xl border border-dashed border-primary/40 p-4 space-y-2 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Add Component</span>
                    <button onClick={() => setShowAddComponent(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COMPONENT_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => { onAddComponent(activePage, type); setShowAddComponent(false); }}
                        className="px-2 py-1 rounded-md border border-border bg-card text-[10px] font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                      >
                        {type.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddComponent(true)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-border hover:border-primary/40 text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Component
                </button>
              )}
            </div>
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
  onDeleteComponent?: (pageIndex: number, componentIndex: number) => void;
  onDuplicateComponent?: (pageIndex: number, componentIndex: number) => void;
  onNavigate?: (pageRoute: string) => void;
  onUpdateComponentProp?: (pageIndex: number, componentIndex: number, propKey: string, value: any) => void;
  multiSelectedComponents?: Set<string>;
  onMultiSelectComponent?: (pageIndex: number, componentIndex: number, add: boolean) => void;
}

function PageRenderer({ page, config, pageIndex, selectedComponent, onSelectComponent, onReorderComponents, onDeleteComponent, onDuplicateComponent, onNavigate, onUpdateComponentProp, multiSelectedComponents, onMultiSelectComponent }: PageRendererProps) {
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
    const multiKey = `${pageIndex}-${i}`;
    const isMultiSelected = multiSelectedComponents?.has(multiKey);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey && onMultiSelectComponent) {
        onMultiSelectComponent(pageIndex, i, !isMultiSelected);
      } else {
        onSelectComponent?.(pageIndex, i);
      }
    };

    return (
      <ContextMenu key={i}>
        <ContextMenuTrigger asChild>
          <div className="relative group">
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
              onClick={handleClick}
              data-component-index={i}
              className={cn(
                "relative cursor-pointer transition-all duration-200",
                isDragging && "opacity-30 scale-[0.98]",
                isMultiSelected && "ring-2 ring-chart-2 ring-offset-2 ring-offset-background rounded-xl",
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl"
                  : !isMultiSelected && "hover:ring-1 hover:ring-primary/30 hover:ring-offset-1 hover:ring-offset-background rounded-xl"
              )}
            >
              <div className={cn(
                "absolute left-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-6 h-8 rounded bg-card/80 border border-border shadow-sm cursor-grab active:cursor-grabbing transition-opacity",
                "opacity-0 group-hover:opacity-100"
              )}>
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              {(isSelected || isMultiSelected) && (
                <div className="absolute -top-2.5 left-9 z-10 flex items-center gap-1">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm",
                    isMultiSelected && !isSelected ? "bg-chart-2 text-primary-foreground" : "bg-primary text-primary-foreground"
                  )}>
                    {comp.type.replace(/_/g, " ")}
                  </span>
                  {onDeleteComponent && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteComponent(pageIndex, i); }}
                      className="px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground text-[10px] font-medium shadow-sm hover:opacity-90 transition-opacity"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              <ComponentRenderer component={comp} config={config} onNavigate={onNavigate} onUpdateProp={onUpdateComponentProp ? (key, val) => onUpdateComponentProp(pageIndex, i, key, val) : undefined} />
            </div>
            {isDropTarget && dragIndex !== null && dragIndex < i && (
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full z-20" />
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onDuplicateComponent?.(pageIndex, i)}>
            <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => i > 0 && onReorderComponents?.(pageIndex, i, i - 1)}
            disabled={i === 0}
          >
            <ChevronUp className="w-3.5 h-3.5 mr-2" /> Move Up
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => i < page.components.length - 1 && onReorderComponents?.(pageIndex, i, i + 1)}
            disabled={i === page.components.length - 1}
          >
            <ChevronDown className="w-3.5 h-3.5 mr-2" /> Move Down
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDeleteComponent?.(pageIndex, i)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  if (page.layout === "dashboard") {
    return (
      <div className="flex flex-col sm:flex-row min-h-[600px]">
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
              <button
                key={p.route}
                onClick={(e) => { e.stopPropagation(); onNavigate?.(p.route); }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-all duration-200 w-full text-left",
                  p.route === page.route
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {p.name}
                {p.route === page.route && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
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
          <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile sidebar icon */}
              <div className="sm:hidden w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">{page.name}</h2>
              <Badge variant="secondary" className="text-[10px] h-5 font-normal hidden sm:inline-flex">
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
          {/* Mobile page tabs */}
          <div className="sm:hidden flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto">
            {config.pages.filter(p => p.layout === "dashboard").map((p) => (
              <button
                key={p.route}
                onClick={(e) => { e.stopPropagation(); onNavigate?.(p.route); }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors",
                  p.route === page.route
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex-1 p-3 sm:p-5 space-y-4 sm:space-y-5 overflow-auto">
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

function ComponentRenderer({ component, config, onNavigate, onUpdateProp }: { component: ComponentConfig; config: AppConfig; onNavigate?: (pageRoute: string) => void; onUpdateProp?: PropUpdater }) {
  const props = component.props || {};
  const up = onUpdateProp;

  switch (component.type) {
    case "hero": return <HeroPreview props={props} config={config} onNavigate={onNavigate} onUpdateProp={up} />;
    case "navbar": return <NavbarPreview props={props} config={config} onNavigate={onNavigate} onUpdateProp={up} />;
    case "footer": return <FooterPreview props={props} config={config} onUpdateProp={up} />;
    case "stats_row": return <StatsRowPreview props={props} config={config} />;
    case "crud_table": return <CrudTablePreview props={props} />;
    case "chart": return <ChartPreview props={props} />;
    case "card_grid": return <CardGridPreview props={props} config={config} />;
    case "auth_form": return <AuthFormPreview props={props} />;
    case "pricing_table": return <PricingTablePreview props={props} onUpdateProp={up} />;
    case "form": return <FormPreview props={props} config={config} />;
    case "search_bar": return <SearchBarPreview props={props} />;
    case "kanban_board": return <KanbanPreview props={props} />;
    case "calendar": return <CalendarPreview props={props} />;
    case "media_gallery": return <MediaGalleryPreview props={props} config={config} />;
    case "notification_center": return <NotificationPreview props={props} />;
    case "timeline": return <TimelinePreview props={props} />;
    case "file_upload": return <FileUploadPreview props={props} />;
    case "role_manager": return <RoleManagerPreview props={props} />;
    case "payment_page": return <PaymentPagePreview props={props} />;
    case "settings_panel": return <SettingsPanelPreview props={props} />;
    case "api_docs": return <ApiDocsPreview props={props} />;
    case "rich_text_editor": return <RichTextEditorPreview props={props} />;
    case "map": return <MapPreview props={props} />;
    case "trusted_by": return <TrustedByPreview props={props} />;
    case "features_grid": return <FeaturesGridPreview props={props} onUpdateProp={up} />;
    case "feature_split": return <FeatureSplitPreview props={props} onUpdateProp={up} />;
    case "how_it_works": return <HowItWorksPreview props={props} onUpdateProp={up} />;
    case "testimonials": return <TestimonialsPreview props={props} onUpdateProp={up} />;
    case "faq": return <FaqPreview props={props} onUpdateProp={up} />;
    case "final_cta": return <FinalCtaPreview props={props} onUpdateProp={up} />;
    // Dynamic sections
    case "stats_banner": return <StatsBannerPreview props={props} />;
    case "video_section": return <VideoSectionPreview props={props} />;
    case "comparison_table": return <ComparisonTablePreview props={props} />;
    case "integrations_grid": return <IntegrationsGridPreview props={props} />;
    case "contact_form": return <ContactFormPreview props={props} />;
    case "newsletter_cta": return <NewsletterCtaPreview props={props} />;
    case "blog_preview": return <BlogPreviewPreview props={props} />;
    case "use_cases": return <UseCasesPreview props={props} />;
    case "team_section": return <TeamSectionPreview props={props} />;
    case "cta_with_image": return <CtaWithImagePreview props={props} />;
    case "logo_carousel": return <LogoCarouselPreview props={props} />;
    case "data_import": return <DataImportPreview props={props} />;
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

function NavbarPreview({ props, config, onNavigate, onUpdateProp }: { props: Record<string, any>; config: AppConfig; onNavigate?: (pageRoute: string) => void; onUpdateProp?: PropUpdater }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = config.pages.length > 1
    ? config.pages.filter(p => p.layout !== "dashboard").map(p => p.name)
    : ["Home", "Features", "Pricing", "About"];

  return (
    <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            {onUpdateProp ? (
              <EditableText value={props.logo_text || config.title} onSave={(v) => onUpdateProp("logo_text", v)} as="span" className="font-bold text-sm text-foreground tracking-tight" />
            ) : (
              <span className="font-bold text-sm text-foreground tracking-tight">{props.logo_text || config.title}</span>
            )}
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item, i) => (
              <button
                key={item}
                onClick={(e) => { e.stopPropagation(); onNavigate?.(item); }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  i === 0 ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {props.show_auth_buttons !== false && (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-8">Sign In</Button>
              <Button size="sm" className="text-xs h-8 shadow-sm">
                Get Started <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setMobileOpen(!mobileOpen); }}
            className="sm:hidden p-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="sm:hidden border-t border-border px-4 py-3 space-y-1 bg-card">
          {navItems.map((item, i) => (
            <button
              key={item}
              onClick={(e) => { e.stopPropagation(); onNavigate?.(item); setMobileOpen(false); }}
              className="block w-full text-left px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {item}
            </button>
          ))}
          {props.show_auth_buttons !== false && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border mt-2">
              <Button variant="ghost" size="sm" className="text-xs h-8 w-full justify-start">Sign In</Button>
              <Button size="sm" className="text-xs h-8 w-full shadow-sm">
                Get Started <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HeroPreview({ props, config, onNavigate, onUpdateProp }: { props: Record<string, any>; config: AppConfig; onNavigate?: (pageRoute: string) => void; onUpdateProp?: PropUpdater }) {
  const alignment = props.alignment || "center";
  const isPortfolio = /portfolio|personal|resume|cv|freelanc/i.test(config.project_type + " " + (config.description || "") + " " + (config.title || ""));
  
  if (isPortfolio) {
    return (
      <div className="relative px-4 sm:px-6 py-12 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
        <div className="absolute top-10 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 sm:gap-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-gradient-primary p-1 shadow-primary-lg">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <User className="w-10 h-10 sm:w-16 sm:h-16 text-primary/40" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 text-center md:text-left space-y-3 sm:space-y-4">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-primary">
                {props.badge_text || "Hello, I'm"}
              </p>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
                {props.headline || "John Doe"}
              </h1>
            </div>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-lg leading-relaxed mx-auto md:mx-0">
              {props.subtitle || "Full-Stack Developer & UI Designer crafting beautiful digital experiences."}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center md:justify-start">
              {["React", "TypeScript", "Node.js", "Figma"].map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1">{tag}</Badge>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center md:justify-start pt-2">
              <Button size="sm" className="text-xs sm:text-sm gap-2 shadow-primary-lg">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Contact Me
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm gap-2">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> View Work
              </Button>
            </div>
            {/* Social links */}
            <div className="flex gap-2 sm:gap-3 justify-center md:justify-start pt-1">
              {[Github, Globe, Mail].map((Icon, i) => (
                <div key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-accent cursor-pointer transition-colors">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative px-6 py-20 overflow-hidden",
      alignment === "center" ? "text-center" : "text-left"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-2xl mx-auto space-y-6">
        {onUpdateProp ? (
          <EditableText value={props.badge_text || "New Release"} onSave={(v) => onUpdateProp("badge_text", v)} as="span">
            <Badge variant="secondary" className="text-xs px-3 py-1 gap-1.5 font-medium">
              <Sparkles className="w-3 h-3" /> {props.badge_text || "New Release"}
            </Badge>
          </EditableText>
        ) : (
          <Badge variant="secondary" className="text-xs px-3 py-1 gap-1.5 font-medium">
            <Sparkles className="w-3 h-3" /> {props.badge_text || "New Release"}
          </Badge>
        )}
        {onUpdateProp ? (
          <EditableText value={props.headline || config.title || "Build Something Amazing"} onSave={(v) => onUpdateProp("headline", v)} as="h1" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight tracking-tight" />
        ) : (
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
            {props.headline || config.title || "Build Something Amazing"}
          </h1>
        )}
        {onUpdateProp ? (
          <EditableText value={props.subtitle || config.description || "The modern platform for building applications faster than ever before."} onSave={(v) => onUpdateProp("subtitle", v)} as="p" className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed" />
        ) : (
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            {props.subtitle || config.description || "The modern platform for building applications faster than ever before."}
          </p>
        )}
        <div className={cn("flex gap-3 pt-2", alignment === "center" ? "justify-center" : "")}>
          {onUpdateProp ? (
            <EditableLink label={props.cta_text || "Get Started"} onSaveLabel={(v) => onUpdateProp("cta_text", v)}>
              <Button size="lg" className="text-sm gap-2 shadow-primary-lg">
                {props.cta_text || "Get Started"} <ArrowUpRight className="w-4 h-4" />
              </Button>
            </EditableLink>
          ) : (
            <Button size="lg" className="text-sm gap-2 shadow-primary-lg">
              {props.cta_text || "Get Started"} <ArrowUpRight className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" size="lg" className="text-sm gap-2">
            <Play className="w-4 h-4" /> Watch Demo
          </Button>
        </div>
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

function StatsRowPreview({ props, config }: { props: Record<string, any>; config: AppConfig }) {
  const isPortfolio = /portfolio|personal|resume|cv|freelanc/i.test(config.project_type + " " + (config.description || "") + " " + (config.title || ""));
  
  if (isPortfolio) {
    const skills = [
      { label: "Years Experience", value: "5+", icon: Clock },
      { label: "Projects Completed", value: "50+", icon: Package },
      { label: "Happy Clients", value: "30+", icon: Heart },
      { label: "Technologies", value: "12+", icon: Code },
    ];
    return (
      <div className="px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {skills.map((m) => (
            <div key={m.label} className="rounded-2xl border border-border bg-card p-5 text-center space-y-2 hover:shadow-md hover:border-primary/20 transition-all">
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                <m.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">{m.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const defaultMetrics = [
    { label: "Total Revenue", value: "$45,231", change: "+20.1%", up: true, icon: DollarSign, color: "text-primary" },
    { label: "Active Users", value: "2,350", change: "+18.2%", up: true, icon: Users, color: "text-primary" },
    { label: "Orders", value: "1,247", change: "-4.5%", up: false, icon: ShoppingCart, color: "text-destructive" },
    { label: "Conversion", value: "3.24%", change: "+12.3%", up: true, icon: Activity, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="px-4 sm:px-5 py-3.5 border-b border-border space-y-3 sm:space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-foreground capitalize">{collection}</h3>
            <Badge variant="secondary" className="text-[10px] h-5 font-normal">{sampleData.length} records</Badge>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm">
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </div>
        <div className="hidden sm:flex items-center justify-end gap-2">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-border bg-muted/20">
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

function CardGridPreview({ props, config }: { props: Record<string, any>; config: AppConfig }) {
  const cols = props.columns || 3;
  const isPortfolio = /portfolio|personal|resume|cv|freelanc/i.test(config.project_type + " " + (config.description || "") + " " + (config.title || ""));

  if (isPortfolio) {
    const projects = [
      { title: "E-Commerce Platform", desc: "Full-stack online store with payments, inventory, and admin dashboard.", tags: ["React", "Node.js", "Stripe"], icon: ShoppingCart },
      { title: "Analytics Dashboard", desc: "Real-time data visualization platform with interactive charts and filters.", tags: ["TypeScript", "D3.js", "PostgreSQL"], icon: BarChart3 },
      { title: "Social Media App", desc: "Community platform with posts, messaging, and user profiles.", tags: ["React Native", "Firebase", "Redux"], icon: Users },
      { title: "AI Content Generator", desc: "Machine learning powered tool for automated content creation.", tags: ["Python", "OpenAI", "FastAPI"], icon: Sparkles },
      { title: "Task Management", desc: "Kanban-style project management with team collaboration features.", tags: ["Vue.js", "GraphQL", "MongoDB"], icon: LayoutGrid },
      { title: "Portfolio Website", desc: "Responsive personal portfolio with blog, gallery, and contact form.", tags: ["Next.js", "Tailwind", "MDX"], icon: Globe },
    ].slice(0, Math.min(cols * 2, 6));

    return (
      <div className="px-6 py-10">
        <div className="text-center mb-8 space-y-2">
          <Badge variant="secondary" className="text-xs px-3 py-1">My Work</Badge>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Featured Projects</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">A selection of my recent work across different technologies and industries.</p>
        </div>
        <div className={cn("grid gap-5", `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(cols, 3)}`)}>
          {projects.map((project, i) => {
            const Icon = project.icon;
            return (
              <div key={i} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Icon className="w-12 h-12 text-primary/20 group-hover:text-primary/40 group-hover:scale-110 transition-all duration-500" />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-card/90 border border-border flex items-center justify-center">
                      <ExternalLink className="w-3.5 h-3.5 text-foreground" />
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{project.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{project.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[10px] font-normal">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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

function PricingTablePreview({ props, onUpdateProp }: { props: Record<string, any>; onUpdateProp?: PropUpdater }) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-3xl mx-auto">
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

function FormPreview({ props, config }: { props: Record<string, any>; config: AppConfig }) {
  const isPortfolio = /portfolio|personal|resume|cv|freelanc|contact/i.test(config.project_type + " " + (config.description || "") + " " + (props.collection || ""));

  if (isPortfolio) {
    return (
      <div className="px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 space-y-2">
            <Badge variant="secondary" className="text-xs px-3 py-1">Contact</Badge>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Get In Touch</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Have a project in mind? Let's work together to bring your ideas to life.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Contact info */}
            <div className="md:col-span-2 space-y-5">
              {[
                { icon: Mail, label: "Email", value: "hello@johndoe.com" },
                { icon: MapPin, label: "Location", value: "San Francisco, CA" },
                { icon: Globe, label: "Website", value: "johndoe.com" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    <p className="text-sm text-foreground font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                {[Github, Globe, Mail].map((Icon, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent cursor-pointer transition-colors">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
            {/* Contact form */}
            <div className="md:col-span-3 rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Name</label>
                  <Input placeholder="John Doe" className="h-10 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Email</label>
                  <Input placeholder="you@example.com" className="h-10 text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Subject</label>
                <Input placeholder="Project inquiry" className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Message</label>
                <textarea placeholder="Tell me about your project..." rows={4} className="w-full resize-none px-3 py-2.5 rounded-xl border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <Button className="w-full h-10 text-xs gap-2 shadow-primary-lg">
                <Send className="w-3.5 h-3.5" /> Send Message
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

function MediaGalleryPreview({ props, config }: { props: Record<string, any>; config: AppConfig }) {
  const cols = props.columns || 3;
  const isPortfolio = /portfolio|personal|resume|cv|freelanc/i.test(config.project_type + " " + (config.description || "") + " " + (config.title || ""));

  const gradients = [
    "from-primary/20 to-accent/10",
    "from-accent/20 to-primary/10",
    "from-primary/10 to-primary/20",
    "from-accent/10 to-accent/20",
    "from-primary/15 to-accent/15",
    "from-accent/15 to-primary/15",
  ];

  if (isPortfolio) {
    const skills = [
      { name: "React / Next.js", level: 95, category: "Frontend" },
      { name: "TypeScript", level: 90, category: "Language" },
      { name: "Node.js", level: 85, category: "Backend" },
      { name: "Python", level: 80, category: "Language" },
      { name: "PostgreSQL", level: 85, category: "Database" },
      { name: "Figma / UI Design", level: 75, category: "Design" },
      { name: "Docker / DevOps", level: 70, category: "Infra" },
      { name: "GraphQL", level: 80, category: "API" },
    ];

    return (
      <div className="px-6 py-12">
        <div className="text-center mb-8 space-y-2">
          <Badge variant="secondary" className="text-xs px-3 py-1">Skills</Badge>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Skills & Technologies</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Technologies I work with and my proficiency level in each.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {skills.map((skill) => (
            <div key={skill.name} className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{skill.name}</span>
                <Badge variant="outline" className="text-[10px]">{skill.category}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${skill.level}%` }} />
                </div>
                <span className="text-[10px] font-bold text-primary w-8 text-right">{skill.level}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

// === New Landing Page Section Previews ===

function TrustedByPreview({ props }: { props: Record<string, any> }) {
  const brands = props.logos || ["Vercel", "Stripe", "Notion", "Linear", "Figma", "Supabase"];
  return (
    <div className="px-6 py-14 border-y border-border/50 bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-8">
          {props.label || "Trusted by leading companies"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {brands.map((brand: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight">{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesGridPreview({ props, onUpdateProp }: { props: Record<string, any>; onUpdateProp?: PropUpdater }) {
  const cols = props.columns || 3;
  const defaultFeatures = [
    { title: "Lightning Fast", description: "Optimized for speed with sub-second load times and instant interactions.", icon: Zap },
    { title: "Enterprise Security", description: "Bank-grade encryption, SOC 2 compliance, and role-based access control.", icon: Shield },
    { title: "Advanced Analytics", description: "Real-time dashboards with custom reports and data export capabilities.", icon: BarChart3 },
    { title: "Seamless Integration", description: "Connect with 100+ tools including Slack, Zapier, and custom webhooks.", icon: Globe },
    { title: "Team Collaboration", description: "Real-time editing, comments, and shared workspaces for your entire team.", icon: Users },
    { title: "24/7 Support", description: "Dedicated support team available around the clock via chat and email.", icon: Heart },
  ];

  return (
    <div className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <Badge variant="secondary" className="text-xs px-3 py-1 gap-1.5 font-medium">
            <Sparkles className="w-3 h-3" /> Features
          </Badge>
          {onUpdateProp ? (
            <EditableText value={props.headline || "Everything you need to succeed"} onSave={(v) => onUpdateProp("headline", v)} as="h2" className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight" />
          ) : (
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {props.headline || "Everything you need to succeed"}
            </h2>
          )}
          {onUpdateProp ? (
            <EditableText value={props.subtitle || "Powerful features designed to help you build, launch, and scale faster than ever."} onSave={(v) => onUpdateProp("subtitle", v)} as="p" className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed" />
          ) : (
            <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {props.subtitle || "Powerful features designed to help you build, launch, and scale faster than ever."}
            </p>
          )}
        </div>
        <div className={cn("grid gap-6", `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(cols, 3)}`)}>
          {defaultFeatures.slice(0, cols * 2).map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="group rounded-2xl border border-border bg-card p-6 space-y-3 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground tracking-tight">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FeatureSplitPreview({ props, onUpdateProp }: { props: Record<string, any>; onUpdateProp?: PropUpdater }) {
  const imageSide = props.image_side || "right";
  const defaultFeatures = [
    "Real-time collaboration with your entire team",
    "Automated workflows that save hours every week",
    "Deep integrations with 100+ popular tools",
    "Advanced analytics and reporting dashboard",
  ];
  const features = props.features || defaultFeatures;

  const textContent = (
    <div className="space-y-6">
      <Badge variant="secondary" className="text-xs px-3 py-1 font-medium">
        {props.badge_text || "Why Choose Us"}
      </Badge>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
        {props.headline || "Built for modern teams who move fast"}
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed">
        {props.description || "Streamline your workflow with powerful automation, real-time collaboration, and deep integrations that connect your favorite tools."}
      </p>
      <ul className="space-y-3">
        {features.map((feat: string, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm text-foreground leading-relaxed">{feat}</span>
          </li>
        ))}
      </ul>
      <Button size="lg" className="text-sm gap-2 shadow-sm">
        {props.cta_text || "Learn More"} <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );

  const imageContent = (
    <div className="relative">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-border p-8 aspect-[4/3] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-2.5 rounded-full bg-foreground/10 w-3/4" />
              <div className="h-2 rounded-full bg-foreground/5 w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-2.5 rounded-full bg-foreground/10 w-2/3" />
              <div className="h-2 rounded-full bg-foreground/5 w-1/3" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-2.5 rounded-full bg-foreground/10 w-4/5" />
              <div className="h-2 rounded-full bg-foreground/5 w-2/5" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -top-3 -right-3 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-3 -left-3 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
    </div>
  );

  return (
    <div className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {imageSide === "left" ? (
            <>{imageContent}{textContent}</>
          ) : (
            <>{textContent}{imageContent}</>
          )}
        </div>
      </div>
    </div>
  );
}

function HowItWorksPreview({ props, onUpdateProp }: { props: Record<string, any>; onUpdateProp?: PropUpdater }) {
  const defaultSteps = [
    { title: "Create your account", description: "Sign up in seconds with just your email. No credit card required to get started." },
    { title: "Configure your workspace", description: "Set up your team, customize your dashboard, and connect your favorite tools." },
    { title: "Launch and grow", description: "Start using powerful features to build, measure, and scale your business." },
  ];
  const steps = props.steps || defaultSteps;

  return (
    <div className="px-6 py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <Badge variant="secondary" className="text-xs px-3 py-1 font-medium">How it works</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {props.headline || "Get started in minutes"}
          </h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {props.subtitle || "Three simple steps to transform the way you work."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step: any, i: number) => (
            <div key={i} className="relative text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto text-lg font-extrabold shadow-lg">
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
              )}
              <h3 className="text-base font-bold text-foreground tracking-tight">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsPreview({ props, onUpdateProp }: { props: Record<string, any>; onUpdateProp?: PropUpdater }) {
  const defaultTestimonials = [
    { quote: "This platform completely transformed how we manage our business. The analytics alone saved us 20 hours per week.", name: "Sarah Johnson", role: "CEO at TechFlow", avatar: "S" },
    { quote: "Best investment we've made this year. The team collaboration features are incredibly intuitive and powerful.", name: "Michael Chen", role: "CTO at ScaleUp", avatar: "M" },
    { quote: "We migrated from three different tools to this one platform. Couldn't be happier with the results.", name: "Emma Williams", role: "VP Product at DataCo", avatar: "E" },
  ];
  const testimonials = props.testimonials || defaultTestimonials;

  return (
    <div className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <Badge variant="secondary" className="text-xs px-3 py-1 font-medium">Testimonials</Badge>
          {onUpdateProp ? (
            <EditableText value={props.headline || "Loved by thousands of teams"} onSave={(v) => onUpdateProp("headline", v)} as="h2" className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight" />
          ) : (
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {props.headline || "Loved by thousands of teams"}
            </h2>
          )}
          {onUpdateProp ? (
            <EditableText value={props.subtitle || "See why leading companies choose us to power their business."} onSave={(v) => onUpdateProp("subtitle", v)} as="p" className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed" />
          ) : (
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {props.subtitle || "See why leading companies choose us to power their business."}
            </p>
          )}
        </div>
        <div className={cn("grid gap-6", `grid-cols-1 md:grid-cols-${Math.min(props.columns || 3, 3)}`)}>
          {testimonials.map((t: any, i: number) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4 hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed italic">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">{t.avatar || t.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqPreview({ props, onUpdateProp }: { props: Record<string, any>; onUpdateProp?: PropUpdater }) {
  const defaultFaqs = [
    { question: "How do I get started?", answer: "Simply create a free account and follow the guided setup wizard. You'll be up and running in under 5 minutes." },
    { question: "Is there a free trial?", answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required." },
    { question: "Can I cancel anytime?", answer: "Absolutely. You can cancel your subscription at any time with no penalties or hidden fees." },
    { question: "Do you offer team pricing?", answer: "Yes, we have special pricing for teams of 5+. Contact our sales team for a custom quote." },
    { question: "What kind of support do you offer?", answer: "We provide 24/7 support via live chat, email, and phone for all paid plans." },
  ];
  const faqs = props.items || defaultFaqs;

  return (
    <div className="px-6 py-20 bg-muted/30">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <Badge variant="secondary" className="text-xs px-3 py-1 font-medium">FAQ</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {props.headline || "Frequently asked questions"}
          </h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            {props.subtitle || "Everything you need to know. Can't find what you're looking for? Contact us."}
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq: any, i: number) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer">
                <span className="text-sm font-semibold text-foreground pr-4">{faq.question}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
              {i === 0 && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinalCtaPreview({ props, onUpdateProp }: { props: Record<string, any>; onUpdateProp?: PropUpdater }) {
  return (
    <div className="px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="relative text-center py-16 px-8 space-y-6">
            {onUpdateProp ? (
              <EditableText value={props.headline || "Ready to transform your business?"} onSave={(v) => onUpdateProp("headline", v)} as="h2" className="text-3xl sm:text-4xl font-extrabold text-primary-foreground tracking-tight leading-tight" />
            ) : (
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground tracking-tight leading-tight">
                {props.headline || "Ready to transform your business?"}
              </h2>
            )}
            {onUpdateProp ? (
              <EditableText value={props.subtitle || "Join thousands of companies already using our platform to grow faster and work smarter."} onSave={(v) => onUpdateProp("subtitle", v)} as="p" className="text-base text-primary-foreground/80 max-w-lg mx-auto leading-relaxed" />
            ) : (
              <p className="text-base text-primary-foreground/80 max-w-lg mx-auto leading-relaxed">
                {props.subtitle || "Join thousands of companies already using our platform to grow faster and work smarter."}
              </p>
            )}
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-sm font-semibold gap-2 shadow-lg">
                {props.primary_cta || "Get Started Free"} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-sm">
                {props.secondary_cta || "Talk to Sales"}
              </Button>
            </div>
            <p className="text-xs text-primary-foreground/60">No credit card required · Free 14-day trial · Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FooterPreview({ props, config, onUpdateProp }: { props: Record<string, any>; config?: AppConfig; onUpdateProp?: PropUpdater }) {
  const isPortfolio = config && /portfolio|personal|resume|cv|freelanc/i.test(config.project_type + " " + (config.description || "") + " " + (config.title || ""));

  if (isPortfolio) {
    return (
      <div className="px-6 py-10 border-t border-border bg-card mt-auto">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-foreground">John Doe</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Crafting digital experiences with passion. Let's build something amazing together.
          </p>
          <div className="flex items-center justify-center gap-3">
            {[Github, Globe, Mail].map((Icon, i) => (
              <div key={i} className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-accent cursor-pointer transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
          <Separator />
          <p className="text-[11px] text-muted-foreground">
            © 2024 John Doe. All rights reserved. Built with ❤️
          </p>
        </div>
      </div>
    );
  }

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

// === Dynamic Section Previews ===

function StatsBannerPreview({ props }: { props: Record<string, any> }) {
  const stats = props.stats || [
    { label: "Users", value: "10K+", suffix: "" },
    { label: "Uptime", value: "99.9", suffix: "%" },
    { label: "Countries", value: "50", suffix: "+" },
    { label: "Deployments", value: "1M", suffix: "+" },
  ];
  return (
    <div className="py-20 bg-gradient-to-r from-primary/10 via-background to-primary/5">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{props.headline || "Our Impact in Numbers"}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s: any, i: number) => (
            <div key={i} className="space-y-1">
              <p className="text-4xl md:text-5xl font-extrabold text-primary">{s.value}{s.suffix}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoSectionPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{props.headline || "See it in action"}</h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">{props.subtitle || "Watch a quick demo"}</p>
        </div>
        <div className="relative aspect-video rounded-2xl border border-border bg-card overflow-hidden shadow-lg group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-primary-foreground ml-1" />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">3:24</Badge>
            <span className="text-xs text-muted-foreground">Product Demo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonTablePreview({ props }: { props: Record<string, any> }) {
  const columns = props.columns || ["Us", "Competitor A", "Competitor B"];
  const rows = props.rows || [
    { feature: "AI Builder", values: [true, false, false] },
    { feature: "Plugin System", values: [true, true, false] },
    { feature: "RBAC", values: [true, false, true] },
    { feature: "Auto Deploy", values: [true, false, false] },
  ];
  return (
    <div className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-6 space-y-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight text-center">{props.headline || "How we compare"}</h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-4 font-medium text-muted-foreground">Feature</th>
              {columns.map((col: string, i: number) => (
                <th key={i} className={cn("text-center px-4 py-4 font-semibold", i === 0 ? "text-primary" : "text-muted-foreground")}>{col}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map((row: any, i: number) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 text-foreground font-medium">{row.feature}</td>
                  {(row.values || []).map((v: boolean, j: number) => (
                    <td key={j} className="text-center px-4 py-3">
                      {v ? <Check className="w-4 h-4 text-primary mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>
    </div>
  );
}

function IntegrationsGridPreview({ props }: { props: Record<string, any> }) {
  const integrations = props.integrations || ["Slack", "GitHub", "Stripe", "Notion", "Figma", "Jira", "AWS", "Vercel"];
  return (
    <div className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{props.headline || "Integrates with your tools"}</h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">{props.subtitle || "Connect with the tools you already use"}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {integrations.map((name: string, i: number) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-3 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{typeof name === "string" ? name : (name as any).name || "Integration"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactFormPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{props.headline || "Get in touch"}</h2>
            <p className="text-base text-muted-foreground leading-relaxed">{props.subtitle || "We'd love to hear from you"}</p>
            <div className="space-y-4">
              {[{ icon: Mail, text: "hello@example.com" }, { icon: MapPin, text: "San Francisco, CA" }].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            {["Name", "Email", "Message"].map((field) => (
              <div key={field}>
                <label className="block text-xs font-medium text-foreground mb-1.5">{field}</label>
                {field === "Message" ? (
                  <div className="w-full h-24 rounded-xl border border-input bg-background" />
                ) : (
                  <Input placeholder={`Your ${field.toLowerCase()}`} className="rounded-xl" />
                )}
              </div>
            ))}
            <Button className="w-full rounded-xl">{props.submit_text || "Send Message"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsletterCtaPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="py-20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
      <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{props.headline || "Stay in the loop"}</h2>
        <p className="text-base text-muted-foreground">{props.subtitle || "Get the latest updates delivered to your inbox"}</p>
        <div className="flex gap-3 max-w-md mx-auto">
          <Input placeholder={props.placeholder || "Enter your email"} className="flex-1 rounded-xl" />
          <Button className="rounded-xl px-6">{props.button_text || "Subscribe"}</Button>
        </div>
        <p className="text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  );
}

function BlogPreviewPreview({ props }: { props: Record<string, any> }) {
  const posts = props.posts || [
    { title: "Getting Started Guide", excerpt: "Learn how to set up your project in minutes", date: "Dec 10, 2024", category: "Tutorial" },
    { title: "Best Practices for Scaling", excerpt: "Tips to grow your application effectively", date: "Dec 8, 2024", category: "Engineering" },
    { title: "New Feature: AI Builder", excerpt: "Generate complete applications from a single prompt", date: "Dec 5, 2024", category: "Product" },
  ];
  return (
    <div className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{props.headline || "Latest from our blog"}</h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">{props.subtitle || "Insights and updates"}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post: any, i: number) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-40 bg-gradient-to-br from-primary/5 to-primary/10" />
              <div className="p-5 space-y-3">
                <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-xs text-muted-foreground">{post.excerpt}</p>
                <p className="text-[10px] text-muted-foreground">{post.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UseCasesPreview({ props }: { props: Record<string, any> }) {
  const cases = props.cases || [
    { title: "Startups", description: "Launch your MVP in hours, not months", icon: "🚀" },
    { title: "Agencies", description: "Deliver client projects faster than ever", icon: "🏢" },
    { title: "Enterprise", description: "Scale with confidence and compliance", icon: "🏗️" },
  ];
  return (
    <div className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{props.headline || "Built for every team"}</h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">{props.subtitle || "See how teams use our platform"}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {cases.map((c: any, i: number) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-8 text-center space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <span className="text-4xl">{c.icon}</span>
              <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.description}</p>
              <Button variant="ghost" size="sm" className="text-primary text-xs">Learn more <ArrowRight className="w-3 h-3 ml-1" /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamSectionPreview({ props }: { props: Record<string, any> }) {
  const members = props.members || [
    { name: "Alex Chen", role: "CEO & Founder", initials: "AC" },
    { name: "Sarah Kim", role: "CTO", initials: "SK" },
    { name: "David Park", role: "Head of Design", initials: "DP" },
    { name: "Lisa Wang", role: "Lead Engineer", initials: "LW" },
  ];
  return (
    <div className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{props.headline || "Meet our team"}</h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">{props.subtitle || "The people behind the product"}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {members.map((m: any, i: number) => (
            <div key={i} className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto flex items-center justify-center text-primary-foreground font-bold text-lg">
                {m.initials || m.name?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CtaWithImagePreview({ props }: { props: Record<string, any> }) {
  const imageRight = props.image_side !== "left";
  return (
    <div className="py-20 bg-background">
      <div className={cn("max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center", !imageRight && "direction-rtl")}>
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{props.headline || "Ready to transform your workflow?"}</h2>
          <p className="text-base text-muted-foreground leading-relaxed">{props.description || "Start building powerful applications today with our AI-powered platform."}</p>
          <Button size="lg" className="rounded-xl shadow-sm">{props.cta_text || "Get Started"} <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
        <div className="rounded-2xl border border-border bg-card aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="text-center space-y-2">
            <Image className="w-12 h-12 text-primary/30 mx-auto" />
            <p className="text-xs text-muted-foreground">Visual Asset</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoCarouselPreview({ props }: { props: Record<string, any> }) {
  const logos = props.logos || ["Stripe", "Notion", "Linear", "Vercel", "Figma", "GitHub", "Slack", "Discord"];
  return (
    <div className="py-16 bg-muted/30 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-sm text-muted-foreground mb-8">{props.title || "Trusted by innovative teams worldwide"}</p>
        <div className="flex items-center gap-12 animate-[scroll_20s_linear_infinite]">
          {[...logos, ...logos].map((name: string, i: number) => (
            <div key={i} className="flex items-center gap-2 shrink-0 opacity-40 hover:opacity-70 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-foreground/50" />
              </div>
              <span className="text-sm font-semibold text-foreground/60 whitespace-nowrap">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataImportPreview({ props }: { props: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{props.title || "Import Data"}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Upload CSV, Excel, or JSON files</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">Beta</Badge>
      </div>
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-3 hover:border-primary/30 transition-colors cursor-pointer">
        <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto" />
        <div>
          <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, .json (max 10MB)</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <FileText className="w-4 h-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">customers_2025.csv</p>
            <p className="text-[10px] text-muted-foreground">2,847 rows • 12 columns</p>
          </div>
          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Ready</Badge>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">products.json</p>
            <p className="text-[10px] text-muted-foreground">156 records</p>
          </div>
          <Progress value={65} className="w-16 h-1.5" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" className="text-xs h-8">Map Columns</Button>
        <Button size="sm" className="text-xs h-8">Import All</Button>
      </div>
    </div>
  );
}
