import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, ExternalLink, FileText, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppConfig } from "@/lib/engine";

export interface NavItem {
  label: string;
  link_type: "page" | "section" | "external";
  target: string; // page route, #section-id, or URL
  open_new_tab?: boolean;
}

interface NavItemsEditorProps {
  items: NavItem[];
  config: AppConfig;
  onChange: (items: NavItem[]) => void;
}

const LINK_TYPE_ICONS = {
  page: FileText,
  section: Hash,
  external: ExternalLink,
};

export function NavItemsEditor({ items, config, onChange }: NavItemsEditorProps) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<NavItem>({ label: "", link_type: "page", target: "" });

  const addItem = () => {
    if (!newItem.label.trim()) return;
    onChange([...items, { ...newItem, label: newItem.label.trim(), target: newItem.target.trim() }]);
    setNewItem({ label: "", link_type: "page", target: "" });
    setAdding(false);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof NavItem, value: any) => {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    onChange(updated);
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  };

  // Get pages for dropdown
  const pages = config.pages.map(p => ({ name: p.name, route: p.route }));

  // Get component IDs for section linking
  const currentPageComponents = config.pages.flatMap(p =>
    (p.components || []).map(c => c.type)
  );
  const sectionOptions = [...new Set(currentPageComponents)].filter(
    t => !["navbar", "footer"].includes(t)
  );

  return (
    <div className="space-y-2">
      {/* Existing items */}
      {items.length === 0 && !adding && (
        <p className="text-[10px] text-muted-foreground">
          No custom links. The navbar auto-generates from pages.
        </p>
      )}

      {items.map((item, i) => {
        const Icon = LINK_TYPE_ICONS[item.link_type];
        return (
          <div key={i} className="flex items-start gap-1 p-1.5 rounded-md border border-border bg-background/50">
            <div className="flex flex-col gap-0.5 mt-0.5">
              <button onClick={() => moveItem(i, i - 1)} className="p-0.5 rounded hover:bg-accent" disabled={i === 0}>
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-1">
                <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
                <Input
                  value={item.label}
                  onChange={(e) => updateItem(i, "label", e.target.value)}
                  className="h-6 text-[10px] flex-1"
                  placeholder="Label"
                />
              </div>
              <div className="flex items-center gap-1">
                <Select
                  value={item.link_type}
                  onValueChange={(v) => updateItem(i, "link_type", v)}
                >
                  <SelectTrigger className="h-6 text-[10px] w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="section">Section</SelectItem>
                    <SelectItem value="external">URL</SelectItem>
                  </SelectContent>
                </Select>

                {item.link_type === "page" ? (
                  <Select
                    value={item.target}
                    onValueChange={(v) => updateItem(i, "target", v)}
                  >
                    <SelectTrigger className="h-6 text-[10px] flex-1">
                      <SelectValue placeholder="Select page" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map(p => (
                        <SelectItem key={p.route} value={p.route}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : item.link_type === "section" ? (
                  <Select
                    value={item.target}
                    onValueChange={(v) => updateItem(i, "target", v)}
                  >
                    <SelectTrigger className="h-6 text-[10px] flex-1">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectionOptions.map(s => (
                        <SelectItem key={s} value={`#${s}`}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={item.target}
                    onChange={(e) => updateItem(i, "target", e.target.value)}
                    className="h-6 text-[10px] flex-1"
                    placeholder="https://..."
                  />
                )}
              </div>
              {item.link_type === "external" && (
                <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.open_new_tab ?? true}
                    onChange={(e) => updateItem(i, "open_new_tab", e.target.checked)}
                    className="rounded"
                  />
                  Open in new tab
                </label>
              )}
            </div>
            <button onClick={() => removeItem(i)} className="p-0.5 rounded hover:bg-destructive/10 text-destructive mt-0.5">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* Add new item */}
      {adding ? (
        <div className="space-y-1.5 p-1.5 rounded-md border border-primary/30 bg-primary/5">
          <Input
            value={newItem.label}
            onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
            className="h-6 text-[10px]"
            placeholder="Link label"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <div className="flex items-center gap-1">
            <Select
              value={newItem.link_type}
              onValueChange={(v: "page" | "section" | "external") => setNewItem({ ...newItem, link_type: v, target: "" })}
            >
              <SelectTrigger className="h-6 text-[10px] w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Page</SelectItem>
                <SelectItem value="section">Section</SelectItem>
                <SelectItem value="external">URL</SelectItem>
              </SelectContent>
            </Select>

            {newItem.link_type === "page" ? (
              <Select value={newItem.target} onValueChange={(v) => setNewItem({ ...newItem, target: v })}>
                <SelectTrigger className="h-6 text-[10px] flex-1">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map(p => (
                    <SelectItem key={p.route} value={p.route}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : newItem.link_type === "section" ? (
              <Select value={newItem.target} onValueChange={(v) => setNewItem({ ...newItem, target: v })}>
                <SelectTrigger className="h-6 text-[10px] flex-1">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sectionOptions.map(s => (
                    <SelectItem key={s} value={`#${s}`}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={newItem.target}
                onChange={(e) => setNewItem({ ...newItem, target: e.target.value })}
                className="h-6 text-[10px] flex-1"
                placeholder="https://..."
              />
            )}
          </div>
          <div className="flex gap-1">
            <Button size="sm" className="h-5 text-[10px] flex-1" onClick={addItem}>Add</Button>
            <Button size="sm" variant="ghost" className="h-5 text-[10px]" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-6 text-[10px]"
          onClick={() => setAdding(true)}
        >
          <Plus className="w-3 h-3 mr-1" /> Add Link
        </Button>
      )}
    </div>
  );
}
