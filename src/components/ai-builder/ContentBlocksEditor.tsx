// ============================================================
// Content Blocks Editor — Add text, images, links in columns
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Type, ImageIcon, Link,
  Columns, GripVertical, Eye, EyeOff,
} from "lucide-react";

export interface ContentBlock {
  id: string;
  type: "text" | "image" | "link" | "spacer";
  // Layout
  colSpan: number; // 1-12
  // Text props
  text?: string;
  textTag?: "p" | "h1" | "h2" | "h3" | "span";
  textAlign?: "left" | "center" | "right";
  textSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  textWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  textColor?: string;
  // Image props
  imageSrc?: string;
  imageAlt?: string;
  imageOpacity?: number;
  imageRounded?: string;
  imageMaxHeight?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
  // Link props
  linkUrl?: string;
  linkLabel?: string;
  linkStyle?: "button" | "text" | "outline";
  // Spacer
  spacerHeight?: string;
  // Visibility
  visible?: boolean;
}

function genId() {
  return Math.random().toString(36).substring(2, 9);
}

const DEFAULT_BLOCKS: Record<ContentBlock["type"], Partial<ContentBlock>> = {
  text: { text: "Your text here", textTag: "p", textAlign: "left", textSize: "base", textWeight: "normal", colSpan: 12, visible: true },
  image: { imageSrc: "", imageAlt: "Image", imageOpacity: 1, imageRounded: "lg", objectFit: "cover", colSpan: 12, visible: true, imageMaxHeight: "200px" },
  link: { linkUrl: "#", linkLabel: "Click here", linkStyle: "button", colSpan: 12, visible: true },
  spacer: { spacerHeight: "24px", colSpan: 12, visible: true },
};

interface ContentBlocksEditorProps {
  blocks: ContentBlock[];
  columns: number;
  position: "above" | "below";
  onChange: (blocks: ContentBlock[], columns: number, position: "above" | "below") => void;
}

export function ContentBlocksEditor({ blocks, columns, position, onChange }: ContentBlocksEditorProps) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = { id: genId(), type, ...DEFAULT_BLOCKS[type] } as ContentBlock;
    onChange([...blocks, newBlock], columns, position);
    setExpandedBlock(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b), columns, position);
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id), columns, position);
    if (expandedBlock === id) setExpandedBlock(null);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onChange(next, columns, position);
  };

  return (
    <div className="space-y-2">
      {/* Layout controls */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium text-foreground">Grid Columns</label>
          <div className="flex rounded-md border border-border overflow-hidden">
            {[1, 2, 3, 4].map(c => (
              <button
                key={c}
                onClick={() => onChange(blocks, c, position)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium transition-colors",
                  columns === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium text-foreground">Position</label>
          <div className="flex rounded-md border border-border overflow-hidden">
            {(["above", "below"] as const).map(p => (
              <button
                key={p}
                onClick={() => onChange(blocks, columns, p)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium transition-colors capitalize",
                  position === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Block list */}
      {blocks.length > 0 && (
        <div className="space-y-1">
          {blocks.map((block, idx) => (
            <div key={block.id} className="border border-border rounded-md bg-background">
              {/* Block header */}
              <div
                className="flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
              >
                <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
                {block.type === "text" && <Type className="w-3 h-3 text-primary shrink-0" />}
                {block.type === "image" && <ImageIcon className="w-3 h-3 text-primary shrink-0" />}
                {block.type === "link" && <Link className="w-3 h-3 text-primary shrink-0" />}
                {block.type === "spacer" && <Columns className="w-3 h-3 text-primary shrink-0" />}
                <span className="text-[10px] font-medium text-foreground flex-1 truncate capitalize">
                  {block.type}{block.type === "text" ? `: ${(block.text || "").slice(0, 20)}` : block.type === "image" ? " block" : block.type === "link" ? `: ${block.linkLabel || ""}` : ""}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { visible: !(block.visible ?? true) }); }} className="p-0.5 rounded hover:bg-accent" title="Toggle visibility">
                    {(block.visible ?? true) ? <Eye className="w-2.5 h-2.5 text-muted-foreground" /> : <EyeOff className="w-2.5 h-2.5 text-muted-foreground" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} disabled={idx === 0} className="p-0.5 rounded hover:bg-accent disabled:opacity-30">
                    <ChevronUp className="w-2.5 h-2.5 text-muted-foreground" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} disabled={idx === blocks.length - 1} className="p-0.5 rounded hover:bg-accent disabled:opacity-30">
                    <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-0.5 rounded hover:bg-destructive/10">
                    <Trash2 className="w-2.5 h-2.5 text-destructive" />
                  </button>
                </div>
              </div>

              {/* Expanded editor */}
              {expandedBlock === block.id && (
                <div className="px-2 pb-2 space-y-1.5 border-t border-border pt-1.5">
                  {/* Column span */}
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-medium text-muted-foreground">Col Span</label>
                    <div className="flex rounded-md border border-border overflow-hidden">
                      {[3, 4, 6, 8, 12].map(s => (
                        <button
                          key={s}
                          onClick={() => updateBlock(block.id, { colSpan: s })}
                          className={cn(
                            "px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                            block.colSpan === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {s === 12 ? "Full" : s === 6 ? "1/2" : s === 4 ? "1/3" : s === 3 ? "1/4" : `${s}/12`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text block settings */}
                  {block.type === "text" && (
                    <div className="space-y-1.5">
                      <textarea
                        value={block.text || ""}
                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                        placeholder="Enter text..."
                        className="w-full h-16 rounded-md border border-border bg-background text-xs p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex items-center gap-1">
                        <label className="text-[9px] text-muted-foreground w-8">Tag</label>
                        <div className="flex rounded-md border border-border overflow-hidden flex-1">
                          {(["p", "h1", "h2", "h3", "span"] as const).map(t => (
                            <button key={t} onClick={() => updateBlock(block.id, { textTag: t })}
                              className={cn("flex-1 px-1 py-0.5 text-[9px] font-medium", block.textTag === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
                            >{t}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[9px] text-muted-foreground w-8">Size</label>
                        <div className="flex rounded-md border border-border overflow-hidden flex-1">
                          {(["xs", "sm", "base", "lg", "xl", "2xl"] as const).map(s => (
                            <button key={s} onClick={() => updateBlock(block.id, { textSize: s })}
                              className={cn("flex-1 px-1 py-0.5 text-[9px] font-medium", block.textSize === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
                            >{s}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[9px] text-muted-foreground w-8">Wt</label>
                        <div className="flex rounded-md border border-border overflow-hidden flex-1">
                          {(["normal", "medium", "semibold", "bold"] as const).map(w => (
                            <button key={w} onClick={() => updateBlock(block.id, { textWeight: w })}
                              className={cn("flex-1 px-1 py-0.5 text-[9px] font-medium capitalize", block.textWeight === w ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
                            >{w.slice(0, 4)}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[9px] text-muted-foreground w-8">Align</label>
                        <div className="flex rounded-md border border-border overflow-hidden flex-1">
                          {(["left", "center", "right"] as const).map(a => (
                            <button key={a} onClick={() => updateBlock(block.id, { textAlign: a })}
                              className={cn("flex-1 px-1 py-0.5 text-[9px] font-medium capitalize", block.textAlign === a ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
                            >{a}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[9px] text-muted-foreground w-8">Color</label>
                        <input type="color" value={block.textColor || "#000000"} onChange={(e) => updateBlock(block.id, { textColor: e.target.value })} className="w-6 h-6 rounded border border-border cursor-pointer" />
                        <Input value={block.textColor || ""} onChange={(e) => updateBlock(block.id, { textColor: e.target.value })} placeholder="auto" className="h-6 text-[10px] flex-1" />
                      </div>
                    </div>
                  )}

                  {/* Image block settings */}
                  {block.type === "image" && (
                    <div className="space-y-1.5">
                      <Input value={block.imageSrc || ""} onChange={(e) => updateBlock(block.id, { imageSrc: e.target.value })} placeholder="Image URL..." className="h-7 text-xs" />
                      <Input value={block.imageAlt || ""} onChange={(e) => updateBlock(block.id, { imageAlt: e.target.value })} placeholder="Alt text..." className="h-6 text-[10px]" />
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] text-muted-foreground">Opacity</label>
                        <span className="text-[9px] text-muted-foreground">{Math.round((block.imageOpacity ?? 1) * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05" value={block.imageOpacity ?? 1} onChange={(e) => updateBlock(block.id, { imageOpacity: parseFloat(e.target.value) })} className="w-full h-1.5 rounded-full appearance-none bg-border accent-primary cursor-pointer" />
                      <div className="flex items-center gap-1">
                        <label className="text-[9px] text-muted-foreground w-10">Fit</label>
                        <div className="flex rounded-md border border-border overflow-hidden flex-1">
                          {(["cover", "contain", "fill"] as const).map(f => (
                            <button key={f} onClick={() => updateBlock(block.id, { objectFit: f })}
                              className={cn("flex-1 px-1 py-0.5 text-[9px] font-medium", block.objectFit === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
                            >{f}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[9px] text-muted-foreground w-10">Round</label>
                        <div className="flex rounded-md border border-border overflow-hidden flex-1">
                          {(["none", "md", "lg", "xl", "full"] as const).map(r => (
                            <button key={r} onClick={() => updateBlock(block.id, { imageRounded: r })}
                              className={cn("flex-1 px-1 py-0.5 text-[9px] font-medium", block.imageRounded === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
                            >{r}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[9px] text-muted-foreground w-10">Height</label>
                        <Input value={block.imageMaxHeight || "200px"} onChange={(e) => updateBlock(block.id, { imageMaxHeight: e.target.value })} placeholder="200px" className="h-6 text-[10px] flex-1" />
                      </div>
                      {/* Image preview */}
                      {block.imageSrc && (
                        <div className="rounded-md border border-border overflow-hidden">
                          <img src={block.imageSrc} alt={block.imageAlt || ""} className="w-full h-16 object-cover" style={{ opacity: block.imageOpacity ?? 1 }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Link block settings */}
                  {block.type === "link" && (
                    <div className="space-y-1.5">
                      <Input value={block.linkLabel || ""} onChange={(e) => updateBlock(block.id, { linkLabel: e.target.value })} placeholder="Link label..." className="h-7 text-xs" />
                      <Input value={block.linkUrl || ""} onChange={(e) => updateBlock(block.id, { linkUrl: e.target.value })} placeholder="https://..." className="h-7 text-xs" />
                      <div className="flex items-center gap-1">
                        <label className="text-[9px] text-muted-foreground w-10">Style</label>
                        <div className="flex rounded-md border border-border overflow-hidden flex-1">
                          {(["button", "outline", "text"] as const).map(s => (
                            <button key={s} onClick={() => updateBlock(block.id, { linkStyle: s })}
                              className={cn("flex-1 px-1 py-0.5 text-[9px] font-medium capitalize", block.linkStyle === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
                            >{s}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spacer settings */}
                  {block.type === "spacer" && (
                    <div className="flex items-center gap-1">
                      <label className="text-[9px] text-muted-foreground w-10">Height</label>
                      <Input value={block.spacerHeight || "24px"} onChange={(e) => updateBlock(block.id, { spacerHeight: e.target.value })} placeholder="24px" className="h-6 text-[10px] flex-1" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-1">
        <button onClick={() => addBlock("text")} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[10px] font-medium text-foreground hover:bg-accent transition-colors">
          <Type className="w-3 h-3" /> Text
        </button>
        <button onClick={() => addBlock("image")} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[10px] font-medium text-foreground hover:bg-accent transition-colors">
          <ImageIcon className="w-3 h-3" /> Image
        </button>
        <button onClick={() => addBlock("link")} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[10px] font-medium text-foreground hover:bg-accent transition-colors">
          <Link className="w-3 h-3" /> Link
        </button>
        <button onClick={() => addBlock("spacer")} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[10px] font-medium text-foreground hover:bg-accent transition-colors">
          <Columns className="w-3 h-3" /> Spacer
        </button>
      </div>

      {blocks.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-2">
          Add text, images, or links using the buttons above
        </p>
      )}
    </div>
  );
}

// === Content Blocks Renderer (used in preview) ===

const TEXT_SIZE_MAP: Record<string, string> = {
  xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl", "3xl": "text-3xl",
};
const TEXT_WEIGHT_MAP: Record<string, string> = {
  normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold", extrabold: "font-extrabold",
};
const TEXT_ALIGN_MAP: Record<string, string> = {
  left: "text-left", center: "text-center", right: "text-right",
};
const ROUNDED_MAP: Record<string, string> = {
  none: "rounded-none", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", full: "rounded-full",
};
const COL_SPAN_MAP: Record<number, string> = {
  3: "col-span-3", 4: "col-span-4", 6: "col-span-6", 8: "col-span-8", 12: "col-span-12",
};

export function ContentBlocksRenderer({ blocks, columns }: { blocks: ContentBlock[]; columns: number }) {
  if (!blocks || blocks.length === 0) return null;

  const gridCols = columns === 1 ? "grid-cols-12" : columns === 2 ? "grid-cols-12" : columns === 3 ? "grid-cols-12" : "grid-cols-12";

  return (
    <div className={cn("grid gap-3 px-4 sm:px-6 py-3", gridCols)}>
      {blocks.filter(b => b.visible !== false).map((block) => {
        const spanClass = COL_SPAN_MAP[block.colSpan] || "col-span-12";

        if (block.type === "text") {
          const Tag = block.textTag || "p";
          return (
            <div key={block.id} className={spanClass}>
              <Tag
                className={cn(
                  TEXT_SIZE_MAP[block.textSize || "base"],
                  TEXT_WEIGHT_MAP[block.textWeight || "normal"],
                  TEXT_ALIGN_MAP[block.textAlign || "left"],
                )}
                style={{ color: block.textColor || undefined }}
              >
                {block.text || ""}
              </Tag>
            </div>
          );
        }

        if (block.type === "image") {
          return (
            <div key={block.id} className={spanClass}>
              {block.imageSrc ? (
                <img
                  src={block.imageSrc}
                  alt={block.imageAlt || ""}
                  className={cn(
                    "w-full object-cover",
                    ROUNDED_MAP[block.imageRounded || "lg"],
                  )}
                  style={{
                    opacity: block.imageOpacity ?? 1,
                    maxHeight: block.imageMaxHeight || "200px",
                    objectFit: block.objectFit || "cover",
                  }}
                />
              ) : (
                <div className={cn("w-full bg-muted/30 border border-dashed border-border flex items-center justify-center", ROUNDED_MAP[block.imageRounded || "lg"])} style={{ height: block.imageMaxHeight || "200px" }}>
                  <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                </div>
              )}
            </div>
          );
        }

        if (block.type === "link") {
          const style = block.linkStyle || "button";
          return (
            <div key={block.id} className={spanClass}>
              {style === "button" ? (
                <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:opacity-90 transition-opacity">
                  {block.linkLabel || "Click here"}
                </button>
              ) : style === "outline" ? (
                <button className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors">
                  {block.linkLabel || "Click here"}
                </button>
              ) : (
                <a href={block.linkUrl || "#"} className="text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
                  {block.linkLabel || "Click here"}
                </a>
              )}
            </div>
          );
        }

        if (block.type === "spacer") {
          return <div key={block.id} className={spanClass} style={{ height: block.spacerHeight || "24px" }} />;
        }

        return null;
      })}
    </div>
  );
}
