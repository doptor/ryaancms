import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RotateCcw, Paintbrush, Pipette, ImageIcon, Columns } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentConfig, ComponentType } from "@/lib/engine";
import { getComponentMeta } from "@/lib/engine";
import { useState, useEffect } from "react";
import { ContentBlocksEditor, type ContentBlock } from "./ContentBlocksEditor";
import { ImageUploadField } from "./ImageUploadField";

// Preset color swatches
const COLOR_PRESETS = [
  { label: "None", value: "" },
  { label: "White", value: "#ffffff" },
  { label: "Light Gray", value: "#f8fafc" },
  { label: "Slate", value: "#1e293b" },
  { label: "Dark", value: "#0f172a" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Blue", value: "#2563eb" },
  { label: "Purple", value: "#7c3aed" },
  { label: "Pink", value: "#ec4899" },
  { label: "Green", value: "#10b981" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Cyan", value: "#06b6d4" },
];

const GRADIENT_PRESETS = [
  { label: "None", value: "" },
  { label: "Indigo → Purple", value: "linear-gradient(135deg, #4f46e5, #7c3aed)" },
  { label: "Blue → Cyan", value: "linear-gradient(135deg, #2563eb, #06b6d4)" },
  { label: "Pink → Orange", value: "linear-gradient(135deg, #ec4899, #f97316)" },
  { label: "Green → Teal", value: "linear-gradient(135deg, #10b981, #14b8a6)" },
  { label: "Dark → Slate", value: "linear-gradient(180deg, #0f172a, #1e293b)" },
  { label: "Sunset", value: "linear-gradient(135deg, #f97316, #ef4444, #ec4899)" },
  { label: "Ocean", value: "linear-gradient(135deg, #0ea5e9, #6366f1)" },
  { label: "Forest", value: "linear-gradient(135deg, #059669, #10b981, #34d399)" },
  { label: "Warm", value: "linear-gradient(135deg, #fbbf24, #f97316)" },
  { label: "Cool Gray", value: "linear-gradient(180deg, #f1f5f9, #e2e8f0)" },
  { label: "Night", value: "linear-gradient(135deg, #1e1b4b, #312e81)" },
];

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

          {/* Background Customization */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center gap-1.5">
              <Paintbrush className="w-3 h-3 text-primary" />
              <label className="text-xs font-semibold text-foreground">Background</label>
            </div>
            
            {/* Mode selector */}
            <div className="flex rounded-md border border-border overflow-hidden">
              {(["none", "solid", "gradient", "image", "custom"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    if (mode === "none") {
                      handleChange("_bg_mode", "none");
                      handleChange("_bg_color", "");
                      handleChange("_bg_gradient", "");
                      handleChange("_bg_custom", "");
                      handleChange("_bg_image", "");
                      handleChange("_bg_image_opacity", "");
                    } else {
                      handleChange("_bg_mode", mode);
                    }
                  }}
                  className={cn(
                    "flex-1 px-1.5 py-1 text-[9px] font-medium transition-colors",
                    (editedProps._bg_mode || "none") === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {mode === "none" ? "None" : mode === "solid" ? "Solid" : mode === "gradient" ? "Grad" : mode === "image" ? "Image" : "CSS"}
                </button>
              ))}
            </div>

            {/* Solid color picker */}
            {editedProps._bg_mode === "solid" && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1">
                  {COLOR_PRESETS.filter(c => c.value).map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleChange("_bg_color", color.value)}
                      title={color.label}
                      className={cn(
                        "w-5 h-5 rounded-md border transition-all",
                        editedProps._bg_color === color.value
                          ? "border-primary ring-1 ring-primary scale-110"
                          : "border-border hover:scale-110"
                      )}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <input
                      type="color"
                      value={editedProps._bg_color || "#ffffff"}
                      onChange={(e) => handleChange("_bg_color", e.target.value)}
                      className="w-7 h-7 rounded-md border border-border cursor-pointer"
                    />
                  </div>
                  <Input
                    value={editedProps._bg_color || ""}
                    onChange={(e) => handleChange("_bg_color", e.target.value)}
                    placeholder="#hex or rgb()"
                    className="h-7 text-xs flex-1"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-foreground">Opacity</label>
                    <span className="text-[10px] text-muted-foreground">{Math.round((editedProps._bg_color_opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={editedProps._bg_color_opacity ?? 1}
                    onChange={(e) => handleChange("_bg_color_opacity", parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-border accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>Transparent</span>
                    <span>Solid</span>
                  </div>
                </div>
              </div>
            )}

            {/* Gradient picker */}
            {editedProps._bg_mode === "gradient" && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 gap-1">
                  {GRADIENT_PRESETS.filter(g => g.value).map((grad) => (
                    <button
                      key={grad.label}
                      onClick={() => handleChange("_bg_gradient", grad.value)}
                      title={grad.label}
                      className={cn(
                        "h-6 rounded-md border transition-all",
                        editedProps._bg_gradient === grad.value
                          ? "border-primary ring-1 ring-primary scale-105"
                          : "border-border hover:scale-105"
                      )}
                      style={{ background: grad.value }}
                    />
                  ))}
                </div>
                <Input
                  value={editedProps._bg_gradient || ""}
                  onChange={(e) => handleChange("_bg_gradient", e.target.value)}
                  placeholder="linear-gradient(135deg, #hex, #hex)"
                  className="h-7 text-xs"
                />
              </div>
            )}

            {/* Image with opacity */}
            {editedProps._bg_mode === "image" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-foreground">Image URL or Upload</label>
                  <ImageUploadField
                    value={editedProps._bg_image || ""}
                    onChange={(v) => handleChange("_bg_image", v)}
                    placeholder="https://... or upload"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-foreground">Overlay Opacity</label>
                    <span className="text-[10px] text-muted-foreground">{Math.round((editedProps._bg_image_opacity ?? 0.5) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={editedProps._bg_image_opacity ?? 0.5}
                    onChange={(e) => handleChange("_bg_image_opacity", parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-border accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>Clear</span>
                    <span>Dark</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-foreground">Overlay Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={editedProps._bg_image_overlay_color || "#000000"}
                      onChange={(e) => handleChange("_bg_image_overlay_color", e.target.value)}
                      className="w-7 h-7 rounded-md border border-border cursor-pointer"
                    />
                    <Input
                      value={editedProps._bg_image_overlay_color || "#000000"}
                      onChange={(e) => handleChange("_bg_image_overlay_color", e.target.value)}
                      placeholder="#000000"
                      className="h-7 text-xs flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-foreground">Size</label>
                  <div className="flex rounded-md border border-border overflow-hidden">
                    {(["cover", "contain", "auto"] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => handleChange("_bg_image_size", sz)}
                        className={cn(
                          "flex-1 px-2 py-0.5 text-[10px] font-medium transition-colors",
                          (editedProps._bg_image_size || "cover") === sz
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-foreground">Position</label>
                  <div className="grid grid-cols-3 gap-0.5 border border-border rounded-md overflow-hidden">
                    {["top left","top center","top right","center left","center","center right","bottom left","bottom center","bottom right"].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => handleChange("_bg_image_position", pos)}
                        className={cn(
                          "px-1 py-1 text-[8px] font-medium transition-colors",
                          (editedProps._bg_image_position || "center") === pos
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {pos.replace("center", "mid").split(" ").map(w => w[0].toUpperCase()).join("")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Custom CSS */}
            {editedProps._bg_mode === "custom" && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground">Enter any CSS background value</p>
                <Input
                  value={editedProps._bg_custom || ""}
                  onChange={(e) => handleChange("_bg_custom", e.target.value)}
                  placeholder="e.g. radial-gradient(...) or url(...)"
                  className="h-7 text-xs"
                />
              </div>
            )}

            {/* Live preview */}
            {(editedProps._bg_mode === "solid" || editedProps._bg_mode === "gradient" || editedProps._bg_mode === "custom" || editedProps._bg_mode === "image") && (
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Preview</span>
                <div
                  className="h-12 rounded-md border border-border relative overflow-hidden"
                  style={{
                    background:
                      editedProps._bg_mode === "solid" ? editedProps._bg_color :
                      editedProps._bg_mode === "gradient" ? editedProps._bg_gradient :
                      editedProps._bg_mode === "custom" ? editedProps._bg_custom :
                      undefined,
                    opacity: editedProps._bg_mode === "solid" ? (editedProps._bg_color_opacity ?? 1) : undefined,
                  }}
                >
                  {editedProps._bg_mode === "image" && editedProps._bg_image && (
                    <>
                      <img
                        src={editedProps._bg_image}
                        alt="bg preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundColor: editedProps._bg_image_overlay_color || "#000000",
                          opacity: editedProps._bg_image_opacity ?? 0.5,
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content Blocks */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center gap-1.5">
              <Columns className="w-3 h-3 text-primary" />
              <label className="text-xs font-semibold text-foreground">Content Blocks</label>
            </div>
            <ContentBlocksEditor
              blocks={(editedProps._content_blocks as ContentBlock[]) || []}
              columns={(editedProps._content_columns as number) || 1}
              position={(editedProps._content_position as "above" | "below") || "below"}
              onChange={(blocks, columns, position) => {
                const next = { ...editedProps, _content_blocks: blocks, _content_columns: columns, _content_position: position };
                setEditedProps(next);
                onUpdate(pageIndex, componentIndex, next);
              }}
            />
          </div>

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
