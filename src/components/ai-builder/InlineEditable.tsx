// ============================================================
// Inline Editable Components for AI Builder Preview
// Double-click to edit text, images, and links
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, Image, Link, Check, X } from "lucide-react";

// === Editable Text ===

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  children?: React.ReactNode;
}

export function EditableText({ value, onSave, className, as: Tag = "span", children }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditing(true);
  }, []);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const handleBlur = useCallback(() => {
    if (ref.current) {
      const newValue = ref.current.textContent || "";
      if (newValue !== value) {
        onSave(newValue);
      }
    }
    setEditing(false);
  }, [value, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      if (ref.current) ref.current.textContent = value;
      setEditing(false);
    }
  }, [handleBlur, value]);

  return (
    <Tag
      ref={ref as any}
      className={cn(
        className,
        "relative transition-all duration-150",
        editing
          ? "outline-2 outline-primary outline-offset-2 outline rounded-sm bg-primary/5 cursor-text"
          : "cursor-default group/editable hover:outline-1 hover:outline-dashed hover:outline-primary/40 hover:outline-offset-2 hover:rounded-sm"
      )}
      contentEditable={editing}
      suppressContentEditableWarning
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {children || value}
      {!editing && (
        <span className="inline-flex opacity-0 group-hover/editable:opacity-100 transition-opacity absolute -top-2 -right-2 z-10">
          <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <Pencil className="w-2 h-2 text-primary-foreground" />
          </span>
        </span>
      )}
    </Tag>
  );
}

// === Editable Image ===

interface EditableImageProps {
  src?: string;
  onSave: (url: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function EditableImage({ src, onSave, className, children }: EditableImageProps) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(src || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditing(true);
    setUrl(src || "");
  }, [src]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = useCallback(() => {
    if (url.trim()) {
      onSave(url.trim());
    }
    setEditing(false);
  }, [url, onSave]);

  return (
    <div
      className={cn("relative group/img-edit", className)}
      onDoubleClick={handleDoubleClick}
    >
      {children}
      {!editing && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img-edit:opacity-100 transition-opacity bg-background/40 rounded-inherit pointer-events-none z-10">
          <span className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-medium flex items-center gap-1 shadow-sm">
            <Image className="w-3 h-3" /> Double-click to edit
          </span>
        </div>
      )}
      {editing && (
        <div
          className="absolute inset-x-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg p-2 flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            ref={inputRef}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter image URL..."
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <Button size="sm" className="h-7 w-7 p-0" onClick={handleSave}>
            <Check className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(false)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// === Editable Link ===

interface EditableLinkProps {
  url?: string;
  label?: string;
  onSaveUrl?: (url: string) => void;
  onSaveLabel?: (label: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function EditableLink({ url, label, onSaveUrl, onSaveLabel, className, children }: EditableLinkProps) {
  const [editing, setEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(url || "#");
  const [editLabel, setEditLabel] = useState(label || "");

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditing(true);
    setEditUrl(url || "#");
    setEditLabel(label || "");
  }, [url, label]);

  const handleSave = useCallback(() => {
    if (onSaveUrl && editUrl) onSaveUrl(editUrl);
    if (onSaveLabel && editLabel) onSaveLabel(editLabel);
    setEditing(false);
  }, [editUrl, editLabel, onSaveUrl, onSaveLabel]);

  return (
    <div className={cn("relative group/link-edit inline-flex", className)} onDoubleClick={handleDoubleClick}>
      {children}
      {!editing && (
        <span className="absolute -top-2 -right-2 opacity-0 group-hover/link-edit:opacity-100 transition-opacity z-10">
          <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <Link className="w-2 h-2 text-primary-foreground" />
          </span>
        </span>
      )}
      {editing && (
        <div
          className="absolute inset-x-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg p-2 space-y-1.5 min-w-[220px]"
          onClick={(e) => e.stopPropagation()}
        >
          {onSaveLabel && (
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder="Button label..."
              className="h-7 text-xs"
            />
          )}
          {onSaveUrl && (
            <Input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://..."
              className="h-7 text-xs"
            />
          )}
          <div className="flex gap-1 justify-end">
            <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleSave}>
              Save
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
