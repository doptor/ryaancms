import { useEffect, useState } from "react";
import { AppPreviewRenderer } from "@/components/ai-builder/AppPreviewRenderer";
import type { AppConfig } from "@/lib/engine/component-registry";

export default function PreviewPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai-builder-preview-config");
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch {}

    // Listen for updates from the main builder tab
    const handler = (e: StorageEvent) => {
      if (e.key === "ai-builder-preview-config" && e.newValue) {
        try {
          setConfig(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">No preview available</p>
          <p className="text-sm text-muted-foreground">Build something in the AI Builder first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-auto">
      <AppPreviewRenderer
        config={config}
        selectedComponent={null}
        onSelectComponent={() => {}}
        onReorderComponents={() => {}}
      />
    </div>
  );
}
