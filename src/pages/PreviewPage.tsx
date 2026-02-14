import { useEffect, useState } from "react";
import { AppPreviewRenderer } from "@/components/ai-builder/AppPreviewRenderer";
import type { AppConfig } from "@/lib/engine/component-registry";
import { Monitor, ArrowLeft, Smartphone, Tablet, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Viewport = "desktop" | "tablet" | "mobile";

export default function PreviewPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai-builder-preview-config");
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch {}

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

  const viewportWidths: Record<Viewport, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
  };

  if (!config) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-accent-foreground/5 blur-[100px]" />
        </div>

        <div className="relative z-10 text-center space-y-6 max-w-md px-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-glow">
            <Monitor className="w-9 h-9 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">No Preview Yet</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Build something amazing in the AI Builder first, then come back here to see your live preview.
            </p>
          </div>

          <Button
            onClick={() => navigate("/dashboard/ai-builder")}
            className="bg-gradient-primary text-primary-foreground px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to AI Builder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top toolbar */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-3 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/ai-builder")}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Builder</span>
          </Button>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-[200px]">
            {config.title || "Untitled Project"}
          </span>
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {([
            { key: "desktop", icon: Monitor, label: "Desktop" },
            { key: "tablet", icon: Tablet, label: "Tablet" },
            { key: "mobile", icon: Smartphone, label: "Mobile" },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setViewport(key)}
              title={label}
              className={`p-1.5 rounded-md transition-colors ${
                viewport === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {viewportWidths[viewport]}
          </span>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex justify-center bg-muted/50 p-2 sm:p-4">
        <div
          className="bg-background rounded-lg border border-border shadow-sm overflow-auto transition-all duration-300"
          style={{
            width: viewportWidths[viewport],
            maxWidth: "100%",
            minHeight: "100%",
          }}
        >
          <AppPreviewRenderer
            config={config}
            selectedComponent={null}
            onSelectComponent={() => {}}
            onReorderComponents={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
