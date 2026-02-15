import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Layers, Eye, EyeOff, Copy, Trash2, ChevronUp, ChevronDown,
  GripVertical, FileText, Lock, Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppConfig } from "@/lib/engine";

interface LayerPanelProps {
  config: AppConfig;
  activePage: number;
  selectedComponent: { pageIndex: number; componentIndex: number } | null;
  onSelectComponent: (pageIndex: number, componentIndex: number) => void;
  onDeleteComponent: (pageIndex: number, componentIndex: number) => void;
  onDuplicateComponent: (pageIndex: number, componentIndex: number) => void;
  onMoveComponent: (pageIndex: number, fromIndex: number, toIndex: number) => void;
  onClearSelection: () => void;
}

export function LayerPanel({
  config,
  activePage,
  selectedComponent,
  onSelectComponent,
  onDeleteComponent,
  onDuplicateComponent,
  onMoveComponent,
  onClearSelection,
}: LayerPanelProps) {
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());
  const [lockedLayers, setLockedLayers] = useState<Set<string>>(new Set());

  const page = config.pages[activePage];
  if (!page) return null;

  const toggleHidden = (key: string) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleLocked = (key: string) => {
    setLockedLayers((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Layers</span>
        <Badge variant="secondary" className="text-[10px] h-4 ml-auto">
          {page.components.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {page.components.map((comp, i) => {
            const key = `${activePage}-${i}`;
            const isSelected = selectedComponent?.pageIndex === activePage && selectedComponent?.componentIndex === i;
            const isHidden = hiddenLayers.has(key);
            const isLocked = lockedLayers.has(key);

            return (
              <ContextMenu key={key}>
                <ContextMenuTrigger>
                  <div
                    onClick={() => onSelectComponent(activePage, i)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors group",
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-accent text-foreground border border-transparent",
                      isHidden && "opacity-40"
                    )}
                  >
                    <GripVertical className="w-3 h-3 text-muted-foreground/50 shrink-0 cursor-grab" />
                    <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate font-medium">
                      {comp.type.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleHidden(key); }}
                        className="p-0.5 rounded hover:bg-muted"
                      >
                        {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLocked(key); }}
                        className="p-0.5 rounded hover:bg-muted"
                      >
                        {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onDuplicateComponent(activePage, i)}>
                    <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => i > 0 && onMoveComponent(activePage, i, i - 1)}
                    disabled={i === 0}
                  >
                    <ChevronUp className="w-3.5 h-3.5 mr-2" /> Move Up
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => i < page.components.length - 1 && onMoveComponent(activePage, i, i + 1)}
                    disabled={i === page.components.length - 1}
                  >
                    <ChevronDown className="w-3.5 h-3.5 mr-2" /> Move Down
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => onDeleteComponent(activePage, i)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}

          {page.components.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No components yet.<br />Drag from the palette to add.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
