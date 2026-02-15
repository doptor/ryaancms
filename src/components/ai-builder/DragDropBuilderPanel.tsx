import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles, Search, LayoutGrid, FileText, BarChart3, Table,
  Lock, CreditCard, Image, Calendar, Columns, Clock, MapPin,
  Shield, Upload, Bell, GripVertical, Plus, X, Eye, Trash2,
  ChevronRight, Star, Zap, Send, Heart, Users, Globe,
  Package, Play, Hash, Filter, Layers, Monitor, Smartphone, Tablet,
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppConfig, ComponentConfig } from "@/lib/engine";
import { AppPreviewRenderer } from "./AppPreviewRenderer";
import { PropEditorSidebar } from "./PropEditorSidebar";
import { LayerPanel } from "./LayerPanel";
import { PageManagerPanel } from "./PageManagerPanel";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { CollaborationCursors } from "./CollaborationCursors";

interface DragDropBuilderPanelProps {
  config: AppConfig | null;
  onConfigUpdate: (config: AppConfig) => void;
  selectedComponent: { pageIndex: number; componentIndex: number } | null;
  onSelectComponent: (pageIndex: number, componentIndex: number) => void;
  onClearSelection: () => void;
  onPropUpdate: (pageIndex: number, componentIndex: number, newProps: Record<string, any>) => void;
  projectId?: string;
}

type ViewportSize = "desktop" | "tablet" | "mobile";
type LeftPanel = "components" | "layers" | "pages";

const COMPONENT_CATEGORIES = [
  {
    name: "Layout",
    icon: LayoutGrid,
    items: [
      { type: "navbar", label: "Navigation Bar", icon: LayoutGrid, description: "Top navigation with logo & links" },
      { type: "hero", label: "Hero Section", icon: Sparkles, description: "Eye-catching banner with CTA" },
      { type: "footer", label: "Footer", icon: BarChart3, description: "Site footer with links & info" },
    ],
  },
  {
    name: "Content",
    icon: FileText,
    items: [
      { type: "features_grid", label: "Features Grid", icon: LayoutGrid, description: "Feature cards in a grid" },
      { type: "feature_split", label: "Feature Split", icon: Columns, description: "Image + text side by side" },
      { type: "how_it_works", label: "How It Works", icon: FileText, description: "Step-by-step process" },
      { type: "stats_row", label: "Stats Row", icon: BarChart3, description: "Key metrics display" },
      { type: "testimonials", label: "Testimonials", icon: Star, description: "Customer reviews" },
      { type: "faq", label: "FAQ", icon: FileText, description: "Frequently asked questions" },
      { type: "team_section", label: "Team Section", icon: Users, description: "Team member cards" },
      { type: "blog_preview", label: "Blog Preview", icon: FileText, description: "Latest blog posts" },
    ],
  },
  {
    name: "Data",
    icon: Table,
    items: [
      { type: "crud_table", label: "Data Table", icon: Table, description: "CRUD table with actions" },
      { type: "chart", label: "Chart", icon: BarChart3, description: "Data visualization chart" },
      { type: "card_grid", label: "Card Grid", icon: LayoutGrid, description: "Content cards layout" },
      { type: "kanban_board", label: "Kanban Board", icon: Columns, description: "Drag & drop task board" },
      { type: "calendar", label: "Calendar", icon: Calendar, description: "Event calendar view" },
      { type: "timeline", label: "Timeline", icon: Clock, description: "Chronological events" },
    ],
  },
  {
    name: "Forms & Input",
    icon: FileText,
    items: [
      { type: "form", label: "Form", icon: FileText, description: "Custom input form" },
      { type: "auth_form", label: "Auth Form", icon: Lock, description: "Login / Register form" },
      { type: "search_bar", label: "Search Bar", icon: Search, description: "Search with filters" },
      { type: "contact_form", label: "Contact Form", icon: Send, description: "Contact us form" },
      { type: "newsletter_cta", label: "Newsletter CTA", icon: Send, description: "Email subscription" },
      { type: "file_upload", label: "File Upload", icon: Upload, description: "Drag & drop upload" },
    ],
  },
  {
    name: "Commerce",
    icon: CreditCard,
    items: [
      { type: "pricing_table", label: "Pricing Table", icon: CreditCard, description: "Pricing plan comparison" },
      { type: "payment_page", label: "Payment Page", icon: CreditCard, description: "Checkout flow" },
      { type: "final_cta", label: "Final CTA", icon: Zap, description: "Call-to-action banner" },
    ],
  },
  {
    name: "Media & Other",
    icon: Image,
    items: [
      { type: "media_gallery", label: "Media Gallery", icon: Image, description: "Image/video grid" },
      { type: "map", label: "Map", icon: MapPin, description: "Location map" },
      { type: "notification_center", label: "Notifications", icon: Bell, description: "Notification panel" },
      { type: "role_manager", label: "Role Manager", icon: Shield, description: "RBAC permissions" },
      { type: "settings_panel", label: "Settings", icon: Filter, description: "Settings panel" },
      { type: "rich_text_editor", label: "Rich Text Editor", icon: FileText, description: "WYSIWYG editor" },
    ],
  },
];

const VIEWPORTS: Record<ViewportSize, { width: string; icon: any; label: string }> = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "375px", icon: Smartphone, label: "Mobile" },
};

const ZOOM_LEVELS = [50, 75, 100, 125, 150];

export function DragDropBuilderPanel({
  config,
  onConfigUpdate,
  selectedComponent,
  onSelectComponent,
  onClearSelection,
  onPropUpdate,
  projectId,
}: DragDropBuilderPanelProps) {
  const [paletteSearch, setPaletteSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Layout");
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [dropTargetPage, setDropTargetPage] = useState<number | null>(null);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [leftPanel, setLeftPanel] = useState<LeftPanel>("components");
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());
  const [showGrid, setShowGrid] = useState(false);

  // Undo/redo
  const undoRedo = useUndoRedo<AppConfig>(config);

  // Sync external config into undo system
  useEffect(() => {
    if (config && JSON.stringify(config) !== JSON.stringify(undoRedo.state)) {
      undoRedo.set(config);
    }
  }, [config]);

  // When undo/redo state changes, propagate up
  useEffect(() => {
    if (undoRedo.state && JSON.stringify(undoRedo.state) !== JSON.stringify(config)) {
      onConfigUpdate(undoRedo.state);
    }
  }, [undoRedo.state]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoRedo.undo();
      }
      if (isMeta && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        undoRedo.redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement === document.body) {
          e.preventDefault();
          if (multiSelected.size > 0) {
            handleBulkDelete();
          } else if (selectedComponent) {
            handleDeleteComponent(selectedComponent.pageIndex, selectedComponent.componentIndex);
          }
        }
      }
      if (isMeta && e.key === "d") {
        e.preventDefault();
        if (multiSelected.size > 0) {
          handleBulkDuplicate();
        } else if (selectedComponent) {
          handleDuplicateComponent(selectedComponent.pageIndex, selectedComponent.componentIndex);
        }
      }
      if (e.key === "Escape") {
        setMultiSelected(new Set());
        onClearSelection();
      }
      if (isMeta && e.key === "a" && config) {
        e.preventDefault();
        const page = config.pages[activePage];
        if (page) {
          const all = new Set(page.components.map((_, i) => `${activePage}-${i}`));
          setMultiSelected(all);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedComponent, undoRedo, multiSelected, activePage, config]);

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Layers className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Visual Builder</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Build an app first via chat, then use the visual builder to drag & drop components.
          </p>
        </div>
      </div>
    );
  }

  const currentPage = config.pages[activePage];
  const selectedComp = selectedComponent
    ? config.pages[selectedComponent.pageIndex]?.components[selectedComponent.componentIndex] || null
    : null;

  // Filter palette items
  const filteredCategories = COMPONENT_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.label.toLowerCase().includes(paletteSearch.toLowerCase()) ||
        item.type.includes(paletteSearch.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  // Drag from palette
  const handlePaletteDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("application/x-component-type", type);
    e.dataTransfer.effectAllowed = "copy";
    setDraggedType(type);
  };

  const handlePaletteDragEnd = () => {
    setDraggedType(null);
    setDropTargetPage(null);
    setDropInsertIndex(null);
  };

  // Drop on canvas
  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-component-type")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDropTargetPage(activePage);

      // Calculate insert index based on mouse position
      if (canvasRef.current && currentPage) {
        const componentElements = canvasRef.current.querySelectorAll("[data-component-index]");
        let insertIdx = currentPage.components.length;
        componentElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (e.clientY < midY) {
            const idx = parseInt(el.getAttribute("data-component-index") || "0", 10);
            if (idx < insertIdx) insertIdx = idx;
          }
        });
        setDropInsertIndex(insertIdx);
      }
    }
  };

  const handleCanvasDragLeave = () => {
    setDropTargetPage(null);
    setDropInsertIndex(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData("application/x-component-type");
    if (componentType && config) {
      const updated = { ...config };
      const pages = [...updated.pages];
      const page = { ...pages[activePage] };
      const comps = [...page.components];
      const insertAt = dropInsertIndex ?? comps.length;
      comps.splice(insertAt, 0, { type: componentType, props: {} });
      page.components = comps;
      pages[activePage] = page;
      updated.pages = pages;
      onConfigUpdate(updated);
    }
    setDraggedType(null);
    setDropTargetPage(null);
    setDropInsertIndex(null);
  };

  const handleReorderComponents = (pageIndex: number, fromIndex: number, toIndex: number) => {
    const updated = { ...config };
    const pages = [...updated.pages];
    const page = { ...pages[pageIndex] };
    const components = [...page.components];
    const [moved] = components.splice(fromIndex, 1);
    components.splice(toIndex, 0, moved);
    page.components = components;
    pages[pageIndex] = page;
    updated.pages = pages;
    onConfigUpdate(updated);
  };

  const handleDeleteComponent = (pageIndex: number, componentIndex: number) => {
    const updated = { ...config };
    const pages = [...updated.pages];
    const page = { ...pages[pageIndex] };
    page.components = page.components.filter((_, idx) => idx !== componentIndex);
    pages[pageIndex] = page;
    updated.pages = pages;
    onConfigUpdate(updated);
    onClearSelection();
  };

  const handleDuplicateComponent = (pageIndex: number, componentIndex: number) => {
    const updated = { ...config };
    const pages = [...updated.pages];
    const page = { ...pages[pageIndex] };
    const comp = page.components[componentIndex];
    const clone = JSON.parse(JSON.stringify(comp));
    page.components = [
      ...page.components.slice(0, componentIndex + 1),
      clone,
      ...page.components.slice(componentIndex + 1),
    ];
    pages[pageIndex] = page;
    updated.pages = pages;
    onConfigUpdate(updated);
  };

  const handleAddPage = (name: string, route: string, layout: string) => {
    const updated = { ...config };
    updated.pages = [...updated.pages, { name, route, layout: layout as any, components: [] }];
    onConfigUpdate(updated);
  };

  const handleDeletePage = (pageIndex: number) => {
    if (config.pages.length <= 1) return;
    const updated = { ...config };
    updated.pages = updated.pages.filter((_, idx) => idx !== pageIndex);
    onConfigUpdate(updated);
    if (activePage >= updated.pages.length) setActivePage(Math.max(0, updated.pages.length - 1));
    onClearSelection();
  };

  const handleRenamePage = (pageIndex: number, name: string, route: string) => {
    const updated = { ...config };
    const pages = [...updated.pages];
    pages[pageIndex] = { ...pages[pageIndex], name, route };
    updated.pages = pages;
    onConfigUpdate(updated);
  };

  const handleMultiSelect = useCallback((pi: number, ci: number, add: boolean) => {
    setMultiSelected(prev => {
      const next = new Set(prev);
      const key = `${pi}-${ci}`;
      if (add) next.add(key); else next.delete(key);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (!config || multiSelected.size === 0) return;
    const updated = JSON.parse(JSON.stringify(config));
    const grouped = new Map<number, number[]>();
    multiSelected.forEach(key => {
      const [pi, ci] = key.split("-").map(Number);
      if (!grouped.has(pi)) grouped.set(pi, []);
      grouped.get(pi)!.push(ci);
    });
    grouped.forEach((indices, pi) => {
      indices.sort((a, b) => b - a);
      indices.forEach(ci => {
        updated.pages[pi].components.splice(ci, 1);
      });
    });
    onConfigUpdate(updated);
    setMultiSelected(new Set());
    onClearSelection();
  }, [config, multiSelected, onConfigUpdate, onClearSelection]);

  const handleBulkDuplicate = useCallback(() => {
    if (!config || multiSelected.size === 0) return;
    const updated = JSON.parse(JSON.stringify(config));
    const grouped = new Map<number, number[]>();
    multiSelected.forEach(key => {
      const [pi, ci] = key.split("-").map(Number);
      if (!grouped.has(pi)) grouped.set(pi, []);
      grouped.get(pi)!.push(ci);
    });
    grouped.forEach((indices, pi) => {
      indices.sort((a, b) => a - b);
      let offset = 0;
      indices.forEach(ci => {
        const clone = JSON.parse(JSON.stringify(updated.pages[pi].components[ci + offset]));
        updated.pages[pi].components.splice(ci + offset + 1, 0, clone);
        offset++;
      });
    });
    onConfigUpdate(updated);
    setMultiSelected(new Set());
  }, [config, multiSelected, onConfigUpdate]);

  const zoomIn = () => setZoom((z) => Math.min(150, z + 25));
  const zoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const resetZoom = () => setZoom(100);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full overflow-hidden">
        {/* === Left Panel === */}
        <div className="w-56 border-r border-border bg-card flex flex-col shrink-0">
          {/* Panel switcher */}
          <div className="px-2 py-1.5 border-b border-border">
            <Tabs value={leftPanel} onValueChange={(v) => setLeftPanel(v as LeftPanel)}>
              <TabsList className="h-7 w-full grid grid-cols-3">
                <TabsTrigger value="components" className="text-[10px] h-5 px-1">
                  <Package className="w-3 h-3 mr-0.5" /> Parts
                </TabsTrigger>
                <TabsTrigger value="layers" className="text-[10px] h-5 px-1">
                  <Layers className="w-3 h-3 mr-0.5" /> Layers
                </TabsTrigger>
                <TabsTrigger value="pages" className="text-[10px] h-5 px-1">
                  <Globe className="w-3 h-3 mr-0.5" /> Pages
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Component Palette */}
          {leftPanel === "components" && (
            <>
              <div className="px-3 py-2 border-b border-border">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search components..."
                    value={paletteSearch}
                    onChange={(e) => setPaletteSearch(e.target.value)}
                    className="h-7 pl-7 text-xs bg-muted/50 border-0"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filteredCategories.map((category) => (
                    <div key={category.name}>
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <category.icon className="w-3 h-3" />
                        {category.name}
                        <ChevronRight className={cn("w-3 h-3 ml-auto transition-transform", expandedCategory === category.name && "rotate-90")} />
                      </button>
                      {expandedCategory === category.name && (
                        <div className="space-y-0.5 ml-1 mb-2">
                          {category.items.map((item) => (
                            <div
                              key={item.type}
                              draggable
                              onDragStart={(e) => handlePaletteDragStart(e, item.type)}
                              onDragEnd={handlePaletteDragEnd}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing text-xs transition-all",
                                "border border-transparent hover:border-border hover:bg-accent/50",
                                draggedType === item.type && "opacity-50 border-primary/40 bg-primary/5"
                              )}
                            >
                              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0">
                                <item.icon className="w-3 h-3 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground truncate">{item.label}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                              </div>
                              <GripVertical className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">
                  Drag components onto the canvas
                </p>
              </div>
            </>
          )}

          {/* Layer Panel */}
          {leftPanel === "layers" && (
            <LayerPanel
              config={config}
              activePage={activePage}
              selectedComponent={selectedComponent}
              onSelectComponent={onSelectComponent}
              onDeleteComponent={handleDeleteComponent}
              onDuplicateComponent={handleDuplicateComponent}
              onMoveComponent={handleReorderComponents}
              onClearSelection={onClearSelection}
            />
          )}

          {/* Page Manager */}
          {leftPanel === "pages" && (
            <PageManagerPanel
              config={config}
              activePage={activePage}
              onSetActivePage={setActivePage}
              onAddPage={handleAddPage}
              onDeletePage={handleDeletePage}
              onRenamePage={handleRenamePage}
            />
          )}
        </div>

        {/* === Center: Canvas === */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Canvas</span>
              <Badge variant="secondary" className="text-[10px] h-4">
                {currentPage?.components.length || 0} components
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {/* Undo/Redo */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => undoRedo.undo()}
                    disabled={!undoRedo.canUndo}
                  >
                    <Undo2 className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => undoRedo.redo()}
                    disabled={!undoRedo.canRedo}
                  >
                    <Redo2 className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
              </Tooltip>

              <div className="w-px h-4 bg-border mx-1" />

              {/* Zoom controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={zoomOut} disabled={zoom <= 50}>
                    <ZoomOut className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
              <button
                onClick={resetZoom}
                className="text-[10px] font-medium text-muted-foreground hover:text-foreground min-w-[32px] text-center"
              >
                {zoom}%
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={zoomIn} disabled={zoom >= 150}>
                    <ZoomIn className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>

              <div className="w-px h-4 bg-border mx-1" />

              {/* Viewport toggles */}
              {(Object.entries(VIEWPORTS) as [ViewportSize, typeof VIEWPORTS["desktop"]][]).map(([key, vp]) => {
                const Icon = vp.icon;
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewport === key ? "default" : "ghost"}
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setViewport(key)}
                      >
                        <Icon className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{vp.label}</TooltipContent>
                  </Tooltip>
                );
              })}

              <div className="w-px h-4 bg-border mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showGrid ? "default" : "ghost"}
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <LayoutGrid className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Grid</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Canvas area */}
          <div
            ref={canvasRef}
            className={cn(
              "flex-1 min-h-0 bg-muted/30 overflow-auto flex justify-center p-4 relative",
              dropTargetPage !== null && "ring-2 ring-primary/30 ring-inset"
            )}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
          >
            <div
              className="relative bg-background rounded-lg border border-border shadow-sm overflow-hidden transition-all duration-300 origin-top"
              style={{
                width: VIEWPORTS[viewport].width,
                maxWidth: "100%",
                minHeight: "100%",
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <AppPreviewRenderer
                config={config}
                selectedComponent={selectedComponent}
                onSelectComponent={onSelectComponent}
                onReorderComponents={handleReorderComponents}
                onDeleteComponent={handleDeleteComponent}
                onDuplicateComponent={handleDuplicateComponent}
                multiSelectedComponents={multiSelected}
                onMultiSelectComponent={handleMultiSelect}
                onAddComponent={(pi, type) => {
                  const updated = { ...config };
                  const pages = [...updated.pages];
                  const page = { ...pages[pi] };
                  page.components = [...page.components, { type, props: {} }];
                  pages[pi] = page;
                  updated.pages = pages;
                  onConfigUpdate(updated);
                }}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
              />

              {/* Drop zone indicator when dragging */}
              {draggedType && currentPage?.components.length === 0 && (
                <div className="p-8 border-2 border-dashed border-primary/30 rounded-xl m-4 flex flex-col items-center justify-center gap-2 bg-primary/5 animate-pulse">
                  <Plus className="w-8 h-8 text-primary/50" />
                  <p className="text-sm text-primary/70 font-medium">Drop component here</p>
                </div>
              )}

              {/* Grid overlay */}
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    backgroundImage: "linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              )}
            </div>

            {/* Collaboration cursors */}
            <CollaborationCursors projectId={projectId} containerRef={canvasRef} />

            {/* Bulk actions floating bar */}
            {multiSelected.size > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-lg">
                <Badge variant="secondary" className="text-xs">
                  {multiSelected.size} selected
                </Badge>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleBulkDuplicate}>
                  <Copy className="w-3 h-3 mr-1" /> Duplicate
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleBulkDelete}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setMultiSelected(new Set())}>
                  <X className="w-3 h-3 mr-1" /> Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* === Right: Properties Panel === */}
        {selectedComponent && selectedComp && (
          <PropEditorSidebar
            component={selectedComp}
            componentIndex={selectedComponent.componentIndex}
            pageIndex={selectedComponent.pageIndex}
            config={config || undefined}
            onClose={onClearSelection}
            onUpdate={onPropUpdate}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
