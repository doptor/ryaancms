import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText, Plus, Trash2, Edit, GripVertical, LayoutGrid, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppConfig } from "@/lib/engine";

interface PageManagerPanelProps {
  config: AppConfig;
  activePage: number;
  onSetActivePage: (index: number) => void;
  onAddPage: (name: string, route: string, layout: string) => void;
  onDeletePage: (index: number) => void;
  onRenamePage: (index: number, name: string, route: string) => void;
}

export function PageManagerPanel({
  config,
  activePage,
  onSetActivePage,
  onAddPage,
  onDeletePage,
  onRenamePage,
}: PageManagerPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRoute, setNewRoute] = useState("");
  const [newLayout, setNewLayout] = useState("landing");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoute, setEditRoute] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    const route = newRoute.trim() || `/${newName.toLowerCase().replace(/\s+/g, "-")}`;
    onAddPage(newName.trim(), route, newLayout);
    setNewName("");
    setNewRoute("");
    setNewLayout("landing");
    setShowAdd(false);
  };

  const startEdit = (index: number) => {
    const page = config.pages[index];
    setEditingIndex(index);
    setEditName(page.name);
    setEditRoute(page.route);
  };

  const saveEdit = () => {
    if (editingIndex === null || !editName.trim()) return;
    onRenamePage(editingIndex, editName.trim(), editRoute.trim());
    setEditingIndex(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Pages</span>
        <Badge variant="secondary" className="text-[10px] h-4 ml-auto">
          {config.pages.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {config.pages.map((page, i) => (
            <div
              key={i}
              onClick={() => onSetActivePage(i)}
              className={cn(
                "flex items-center gap-2 px-2 py-2 rounded-md text-xs cursor-pointer transition-colors group",
                activePage === i
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "hover:bg-accent text-foreground border border-transparent"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                {editingIndex === i ? (
                  <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-6 text-xs"
                      placeholder="Page name"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    />
                    <Input
                      value={editRoute}
                      onChange={(e) => setEditRoute(e.target.value)}
                      className="h-6 text-xs"
                      placeholder="/route"
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-5 text-[10px]" onClick={saveEdit}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-5 text-[10px]" onClick={() => setEditingIndex(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium truncate">{page.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{page.route}</p>
                  </>
                )}
              </div>
              <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                {page.layout}
              </Badge>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(i); }}
                  className="p-0.5 rounded hover:bg-muted"
                >
                  <Edit className="w-3 h-3" />
                </button>
                {config.pages.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeletePage(i); }}
                    className="p-0.5 rounded hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Add page section */}
      <div className="p-2 border-t border-border">
        {showAdd ? (
          <div className="space-y-1.5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Page name"
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Input
              value={newRoute}
              onChange={(e) => setNewRoute(e.target.value)}
              placeholder="/route (auto-generated)"
              className="h-7 text-xs"
            />
            <Select value={newLayout} onValueChange={setNewLayout}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landing">Landing</SelectItem>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="blank">Blank</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button size="sm" className="h-6 text-[10px] flex-1" onClick={handleAdd}>Add Page</Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Page
          </Button>
        )}
      </div>
    </div>
  );
}
