import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GeneratedFile } from "./CodePanel";
import { MODULE_TEMPLATES, COMPONENT_TEMPLATE_MAP } from "@/lib/engine/module-templates";
import {
  Play, RefreshCw, Smartphone, Monitor, Tablet,
  Maximize2, Minimize2, Loader2, AlertCircle, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePreviewPanelProps {
  files: GeneratedFile[];
  hasConfig: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

type ViewportSize = "mobile" | "tablet" | "desktop";

const VIEWPORTS: Record<ViewportSize, { width: number; label: string; icon: any }> = {
  mobile: { width: 375, label: "Mobile", icon: Smartphone },
  tablet: { width: 768, label: "Tablet", icon: Tablet },
  desktop: { width: 1280, label: "Desktop", icon: Monitor },
};

/**
 * Builds a standalone HTML document that renders the generated React code
 * using inline React + ReactDOM from CDN, no build step needed.
 */
function buildPreviewHtml(files: GeneratedFile[]): string {
  // Resolve template codes
  const resolvedFiles = files.map((f) => {
    if (f.isTemplate && f.code.startsWith("// Template:")) {
      const typeMatch = f.code.match(/^\/\/ Template: (.+)$/m);
      const componentType = typeMatch?.[1]?.trim();
      if (componentType) {
        const templateId = COMPONENT_TEMPLATE_MAP[componentType];
        const template = MODULE_TEMPLATES.find((t) => t.id === templateId);
        if (template) return { ...f, code: template.code };
      }
    }
    return f;
  });

  // Only page files (not scaffold)
  const pageFiles = resolvedFiles.filter((f) => !f.filename.startsWith("_scaffold/"));

  if (pageFiles.length === 0) return "";

  // Strip TypeScript types, imports, and exports to make it browser-safe JSX
  const sanitizeForBrowser = (code: string, componentName: string): string => {
    let cleaned = code
      // Remove import statements
      .replace(/^import\s+.*?['"];?\s*$/gm, "")
      // Remove export default
      .replace(/^export\s+default\s+/gm, "")
      // Remove named exports
      .replace(/^export\s+/gm, "")
      // Remove TypeScript type annotations from function params
      .replace(/:\s*(React\.FC|FC|JSX\.Element|string|number|boolean|any|void|Props|[\w<>\[\]|&]+)\s*([,\)\=\{])/g, "$2")
      // Remove interface/type declarations
      .replace(/^(interface|type)\s+\w+[\s\S]*?^\}/gm, "")
      // Remove generic type params from function declarations
      .replace(/<\w+>/g, "")
      // Remove 'as' type assertions
      .replace(/\s+as\s+\w+/g, "");

    return cleaned;
  };

  // Build component definitions
  const componentDefs = pageFiles.map((f) => {
    const name = f.pageName.replace(/[^a-zA-Z0-9]/g, "") || "Component";
    const cleaned = sanitizeForBrowser(f.code, name);
    return { name, code: cleaned, route: f.route };
  });

  // Create a simple app that renders all pages as sections
  const componentScripts = componentDefs.map((c) => `
    // --- ${c.name} ---
    ${c.code}
  `).join("\n");

  const appRender = componentDefs.map((c) =>
    `React.createElement("div", { key: "${c.route}", style: { marginBottom: "2rem" } },
      React.createElement("div", { 
        style: { 
          padding: "8px 16px", 
          background: "#f0f0f0", 
          borderRadius: "8px 8px 0 0",
          fontSize: "12px",
          fontWeight: "600",
          color: "#666",
          borderBottom: "1px solid #e0e0e0"
        } 
      }, "📄 ${c.name} — ${c.route}"),
      React.createElement("div", { 
        style: { border: "1px solid #e0e0e0", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }
      }, 
        (function() { try { return React.createElement(${c.name} || "div", null); } catch(e) { return React.createElement("div", {style:{padding:"1rem",color:"#e55"}}, "⚠️ Render error: " + e.message); }})()
      )
    )`
  ).join(",\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; }
    #root { padding: 1rem; }
    .preview-error { padding: 2rem; text-align: center; color: #e55; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    // Stub commonly used imports
    const cn = (...classes) => classes.filter(Boolean).join(" ");
    const toast = (msg) => console.log("Toast:", msg);
    const Button = ({ children, className, onClick, variant, size, disabled, ...props }) => 
      React.createElement("button", { 
        className: cn("px-4 py-2 rounded-lg font-medium text-sm transition-colors", 
          variant === "outline" ? "border border-gray-300 hover:bg-gray-50" : 
          variant === "ghost" ? "hover:bg-gray-100" : 
          "bg-blue-600 text-white hover:bg-blue-700",
          size === "sm" ? "px-3 py-1.5 text-xs" : "",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          className
        ), 
        onClick, disabled, ...props 
      }, children);
    const Input = ({ className, ...props }) => 
      React.createElement("input", { className: cn("px-3 py-2 border rounded-lg text-sm w-full", className), ...props });
    const Card = ({ children, className, ...props }) =>
      React.createElement("div", { className: cn("rounded-xl border bg-white shadow-sm", className), ...props }, children);
    const Badge = ({ children, className, ...props }) =>
      React.createElement("span", { className: cn("px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100", className), ...props }, children);

    try {
      ${componentScripts}

      const App = () => React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { 
          style: { padding: "12px 16px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "12px", marginBottom: "1.5rem" }
        },
          React.createElement("h1", { style: { color: "#fff", fontSize: "16px", fontWeight: "700" } }, "🚀 Live Preview"),
          React.createElement("p", { style: { color: "rgba(255,255,255,0.8)", fontSize: "12px", marginTop: "4px" } }, "${pageFiles.length} page(s) rendered")
        ),
        ${appRender}
      );

      const root = ReactDOM.createRoot(document.getElementById("root"));
      root.render(React.createElement(App));
    } catch (err) {
      document.getElementById("root").innerHTML = '<div class="preview-error"><h2>⚠️ Preview Error</h2><p>' + err.message + '</p></div>';
    }
  <\/script>
</body>
</html>`;
}

export function LivePreviewPanel({ files, hasConfig, isGenerating, onGenerate }: LivePreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewHtml = useMemo(() => buildPreviewHtml(files), [files]);

  const handleRefresh = () => {
    setIsLoading(true);
    setPreviewKey((k) => k + 1);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // No config yet
  if (!hasConfig) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Eye className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Live Preview</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app config first, then generate code to see a live preview.</p>
        </div>
      </div>
    );
  }

  // No files yet
  if (files.length === 0 && !isGenerating) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Play className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Generate & Preview</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Generate React code first, then see it rendered live in a sandboxed iframe.
          </p>
          <Button onClick={onGenerate} className="gap-2">
            <Play className="w-4 h-4" /> Generate Code & Preview
          </Button>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
          <h3 className="text-lg font-semibold text-foreground">Generating Code...</h3>
          <p className="text-sm text-muted-foreground">Preview will appear once code generation is complete.</p>
        </div>
      </div>
    );
  }

  if (!previewHtml) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">No Pages to Preview</h3>
          <p className="text-sm text-muted-foreground">Generated files don't contain renderable page components.</p>
        </div>
      </div>
    );
  }

  const currentViewport = VIEWPORTS[viewport];

  return (
    <div className={cn(
      "flex flex-col h-full",
      isFullscreen && "fixed inset-0 z-50 bg-background"
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Live Preview</span>
          <Badge variant="secondary" className="text-[10px] h-4">
            {files.filter(f => !f.filename.startsWith("_scaffold/")).length} pages
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {/* Viewport switcher */}
          {(Object.entries(VIEWPORTS) as [ViewportSize, typeof VIEWPORTS["mobile"]][]).map(([key, vp]) => {
            const Icon = vp.icon;
            return (
              <Button
                key={key}
                variant={viewport === key ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewport(key)}
                title={vp.label}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            );
          })}
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleRefresh} title="Refresh">
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </Button>
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 min-h-0 bg-muted/30 flex items-start justify-center overflow-auto p-4">
        <div
          className="bg-background rounded-lg border border-border shadow-lg overflow-hidden transition-all duration-300"
          style={{
            width: viewport === "desktop" ? "100%" : `${currentViewport.width}px`,
            maxWidth: "100%",
            height: "100%",
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
          <iframe
            key={previewKey}
            ref={iframeRef}
            srcDoc={previewHtml}
            sandbox="allow-scripts"
            className="w-full h-full border-0"
            title="Live Preview"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
}
