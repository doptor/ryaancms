// ============================================================
// Image Upload Field — URL input + file upload to storage
// ============================================================

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  compact?: boolean;
}

export function ImageUploadField({ value, onChange, placeholder = "Image URL or upload...", className, inputClassName, compact = false }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `builder/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error } = await supabase.storage
        .from("site-assets")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  return (
    <div className={cn("space-y-1", className)}>
      <div
        className={cn(
          "flex items-center gap-1",
          dragOver && "ring-1 ring-primary rounded-md"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(compact ? "h-6 text-[10px]" : "h-7 text-xs", "flex-1", inputClassName)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "shrink-0 rounded-md border border-border flex items-center justify-center transition-colors hover:bg-accent",
            compact ? "w-6 h-6" : "w-7 h-7"
          )}
          title="Upload image"
        >
          {uploading ? (
            <Loader2 className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5", "text-primary animate-spin")} />
          ) : (
            <Upload className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5", "text-muted-foreground")} />
          )}
        </button>
        {value && (
          <button
            onClick={() => onChange("")}
            className={cn(
              "shrink-0 rounded-md border border-border flex items-center justify-center transition-colors hover:bg-destructive/10",
              compact ? "w-6 h-6" : "w-7 h-7"
            )}
            title="Clear"
          >
            <X className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5", "text-muted-foreground")} />
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {dragOver && (
        <p className="text-[9px] text-primary text-center">Drop image here</p>
      )}
    </div>
  );
}
