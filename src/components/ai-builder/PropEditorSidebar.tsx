import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentConfig, ComponentType } from "@/lib/engine";
import { getComponentMeta } from "@/lib/engine";
import { useState, useEffect } from "react";

interface PropEditorSidebarProps {
  component: ComponentConfig | null;
  componentIndex: number;
  pageIndex: number;
  onClose: () => void;
  onUpdate: (pageIndex: number, componentIndex: number, newProps: Record<string, any>) => void;
}

export function PropEditorSidebar({ component, componentIndex, pageIndex, onClose, onUpdate }: PropEditorSidebarProps) {
  const [editedProps, setEditedProps] = useState<Record<string, any>>({});

  useEffect(() => {
    if (component) {
      setEditedProps({ ...(component.props || {}) });
    }
  }, [component]);

  if (!component) return null;

  const meta = getComponentMeta(component.type as ComponentType);
  const schema = meta?.props_schema || [];

  const handleChange = (name: string, value: any) => {
    const next = { ...editedProps, [name]: value };
    setEditedProps(next);
    onUpdate(pageIndex, componentIndex, next);
  };

  const handleReset = () => {
    const original = { ...(component.props || {}) };
    setEditedProps(original);
    onUpdate(pageIndex, componentIndex, original);
  };

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-foreground truncate">
            {meta?.label || component.type.replace(/_/g, " ")}
          </h4>
          <p className="text-[10px] text-muted-foreground">{component.type}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleReset} title="Reset">
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Props */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {schema.length === 0 && (
            <p className="text-xs text-muted-foreground">No configurable props for this component.</p>
          )}
          {schema.map((prop) => {
            const value = editedProps[prop.name] ?? prop.default ?? "";

            if (prop.type === "boolean") {
              return (
                <div key={prop.name} className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-foreground">{prop.name.replace(/_/g, " ")}</label>
                    {prop.description && <p className="text-[10px] text-muted-foreground">{prop.description}</p>}
                  </div>
                  <button
                    onClick={() => handleChange(prop.name, !value)}
                    className={cn(
                      "w-8 h-4.5 rounded-full relative transition-colors",
                      value ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-background transition-all shadow-sm",
                      value ? "left-[calc(100%-0.625rem)]" : "left-0.5"
                    )} />
                  </button>
                </div>
              );
            }

            if (prop.type === "enum" && prop.enum_values) {
              return (
                <div key={prop.name} className="space-y-1">
                  <label className="text-xs font-medium text-foreground">{prop.name.replace(/_/g, " ")}</label>
                  {prop.description && <p className="text-[10px] text-muted-foreground">{prop.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {prop.enum_values.map((ev) => (
                      <button
                        key={ev}
                        onClick={() => handleChange(prop.name, ev)}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors",
                          value === ev
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-primary/30"
                        )}
                      >
                        {ev}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            if (prop.type === "number") {
              return (
                <div key={prop.name} className="space-y-1">
                  <label className="text-xs font-medium text-foreground">{prop.name.replace(/_/g, " ")}</label>
                  {prop.description && <p className="text-[10px] text-muted-foreground">{prop.description}</p>}
                  <Input
                    type="number"
                    value={value}
                    min={prop.min}
                    max={prop.max}
                    onChange={(e) => handleChange(prop.name, Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
              );
            }

            // Default: string
            return (
              <div key={prop.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">{prop.name.replace(/_/g, " ")}</label>
                  {prop.required && <Badge variant="destructive" className="text-[9px] h-3.5 px-1">required</Badge>}
                </div>
                {prop.description && <p className="text-[10px] text-muted-foreground">{prop.description}</p>}
                <Input
                  value={String(value)}
                  onChange={(e) => handleChange(prop.name, e.target.value)}
                  placeholder={prop.name}
                  className="h-7 text-xs"
                />
              </div>
            );
          })}

          {/* Category info */}
          {meta && (
            <div className="pt-2 border-t border-border space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline" className="text-[10px] h-4">{meta.category}</Badge>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Auth required</span>
                <span className="text-foreground">{meta.requires_auth ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Tenant safe</span>
                <span className="text-foreground">{meta.tenant_safe ? "Yes" : "No"}</span>
              </div>
              {meta.requires_modules.length > 0 && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Modules</span>
                  <span className="text-foreground">{meta.requires_modules.join(", ")}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
