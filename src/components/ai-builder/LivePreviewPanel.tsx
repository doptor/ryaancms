import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GeneratedFile } from "./CodePanel";
import { MODULE_TEMPLATES, COMPONENT_TEMPLATE_MAP } from "@/lib/engine/module-templates";
import {
  Play, RefreshCw, Smartphone, Monitor, Tablet,
  Maximize2, Minimize2, Loader2, AlertCircle, Eye,
  Terminal, Trash2, ChevronUp, ChevronDown,
  AlertTriangle, Info, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePreviewPanelProps {
  files: GeneratedFile[];
  hasConfig: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

type ViewportSize = "mobile" | "tablet" | "desktop";

interface ConsoleEntry {
  id: number;
  level: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: number;
}

const VIEWPORTS: Record<ViewportSize, { width: number; label: string; icon: any }> = {
  mobile: { width: 375, label: "Mobile", icon: Smartphone },
  tablet: { width: 768, label: "Tablet", icon: Tablet },
  desktop: { width: 1280, label: "Desktop", icon: Monitor },
};

/**
 * Builds a standalone HTML document that renders the generated React code
 * using inline React + ReactDOM from CDN, no build step needed.
 * Includes console capture that posts messages to parent window.
 */
function buildPreviewHtml(files: GeneratedFile[]): string {
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

  const pageFiles = resolvedFiles.filter((f) => !f.filename.startsWith("_scaffold/"));
  if (pageFiles.length === 0) return "";

  const sanitizeForBrowser = (code: string): string => {
    return code
      .replace(/^import\s+.*?['"];?\s*$/gm, "")
      .replace(/^export\s+default\s+/gm, "")
      .replace(/^export\s+/gm, "")
      .replace(/:\s*(React\.FC|FC|JSX\.Element|string|number|boolean|any|void|Props|[\w<>\[\]|&]+)\s*([,\)\=\{])/g, "$2")
      .replace(/^(interface|type)\s+\w+[\s\S]*?^\}/gm, "")
      .replace(/<\w+>/g, "")
      .replace(/\s+as\s+\w+/g, "");
  };

  const componentDefs = pageFiles.map((f) => {
    const name = f.pageName.replace(/[^a-zA-Z0-9]/g, "") || "Component";
    const cleaned = sanitizeForBrowser(f.code);
    return { name, code: cleaned, route: f.route };
  });

  const componentScripts = componentDefs.map((c) => `
    // --- ${c.name} ---
    ${c.code}
  `).join("\n");

  const appRender = componentDefs.map((c) =>
    `React.createElement("div", { key: "${c.route}", style: { marginBottom: "2rem" } },
      React.createElement("div", { 
        style: { padding: "8px 16px", background: "#f0f0f0", borderRadius: "8px 8px 0 0", fontSize: "12px", fontWeight: "600", color: "#666", borderBottom: "1px solid #e0e0e0" } 
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
    html, body { height: 100%; overflow: auto; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; }
    #root { padding: 1rem; min-height: 100%; }
    .preview-error { padding: 2rem; text-align: center; color: #e55; }
  </style>
  <script>
    // Console capture — posts to parent
    (function() {
      var orig = { log: console.log, warn: console.warn, error: console.error, info: console.info };
      function send(level, args) {
        try {
          var msg = Array.prototype.map.call(args, function(a) {
            return typeof a === 'object' ? JSON.stringify(a) : String(a);
          }).join(' ');
          window.parent.postMessage({ type: '__preview_console__', level: level, message: msg }, '*');
        } catch(e) {}
        orig[level].apply(console, args);
      }
      console.log = function() { send('log', arguments); };
      console.warn = function() { send('warn', arguments); };
      console.error = function() { send('error', arguments); };
      console.info = function() { send('info', arguments); };
      window.onerror = function(msg, src, line, col, err) {
        send('error', ['Uncaught: ' + msg + ' at line ' + line]);
      };
      window.onunhandledrejection = function(e) {
        send('error', ['Unhandled Promise: ' + (e.reason && e.reason.message || e.reason || 'unknown')]);
      };
    })();
  <\/script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

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

    console.info("🚀 Live Preview loaded — ${pageFiles.length} page(s)");

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
      console.log("✅ All components rendered successfully");
    } catch (err) {
      console.error("❌ Preview render failed:", err.message);
      document.getElementById("root").innerHTML = '<div class="preview-error"><h2>⚠️ Preview Error</h2><p>' + err.message + '</p></div>';
    }
  <\/script>
</body>
</html>`;
}

const CONSOLE_ICONS: Record<string, any> = {
  log: Info,
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
};

const CONSOLE_COLORS: Record<string, string> = {
  log: "text-foreground",
  info: "text-primary",
  warn: "text-yellow-600",
  error: "text-destructive",
};

let consoleIdCounter = 0;

export function LivePreviewPanel({ files, hasConfig, isGenerating, onGenerate }: LivePreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const prevFilesRef = useRef<string>("");

  const previewHtml = useMemo(() => buildPreviewHtml(files), [files]);

  // Hot-reload: auto-refresh when files change
  useEffect(() => {
    const filesHash = JSON.stringify(files.map(f => f.code));
    if (prevFilesRef.current && prevFilesRef.current !== filesHash && files.length > 0) {
      setIsLoading(true);
      setConsoleLogs([]);
      setPreviewKey((k) => k + 1);
    }
    prevFilesRef.current = filesHash;
  }, [files]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "__preview_console__") {
        const entry: ConsoleEntry = {
          id: ++consoleIdCounter,
          level: event.data.level,
          message: event.data.message,
          timestamp: Date.now(),
        };
        setConsoleLogs((prev) => [...prev.slice(-200), entry]); // Keep max 200 entries
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  const handleRefresh = () => {
    setIsLoading(true);
    setConsoleLogs([]);
    setPreviewKey((k) => k + 1);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const errorCount = consoleLogs.filter((l) => l.level === "error").length;
  const warnCount = consoleLogs.filter((l) => l.level === "warn").length;

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
          <Badge variant="secondary" className="text-[10px] h-4 gap-0.5">
            <RefreshCw className="w-2.5 h-2.5" /> Hot Reload
          </Badge>
        </div>
        <div className="flex items-center gap-1">
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
      <div className="flex-1 min-h-0 bg-muted/30 flex items-start justify-center overflow-hidden p-4 relative">
        <div
          className="bg-background rounded-lg border border-border shadow-lg overflow-hidden transition-all duration-300 flex flex-col"
          style={{
            width: viewport === "desktop" ? "100%" : `${currentViewport.width}px`,
            maxWidth: "100%",
            height: "100%",
            minHeight: 0,
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
            sandbox="allow-scripts allow-same-origin"
            className="w-full border-0 flex-1 min-h-0"
            style={{ height: "100%" }}
            title="Live Preview"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>

      {/* Console Panel */}
      <div className="shrink-0 border-t border-border bg-card">
        {/* Console header */}
        <button
          onClick={() => setConsoleOpen(!consoleOpen)}
          className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Console</span>
            {consoleLogs.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4">{consoleLogs.length}</Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 gap-0.5">
                <XCircle className="w-2.5 h-2.5" /> {errorCount}
              </Badge>
            )}
            {warnCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 gap-0.5 bg-yellow-500/10 text-yellow-600">
                <AlertTriangle className="w-2.5 h-2.5" /> {warnCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {consoleOpen && (
              <Button
                variant="ghost" size="sm" className="h-6 w-6 p-0"
                onClick={(e) => { e.stopPropagation(); setConsoleLogs([]); }}
                title="Clear Console"
              >
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            )}
            {consoleOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </button>

        {/* Console output */}
        {consoleOpen && (
          <ScrollArea className="h-36 border-t border-border">
            <div className="p-2 space-y-0.5 font-mono text-[11px]">
              {consoleLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No console output yet. Preview will capture logs, warnings, and errors.</p>
              ) : (
                consoleLogs.map((entry) => {
                  const Icon = CONSOLE_ICONS[entry.level] || Info;
                  const colorClass = CONSOLE_COLORS[entry.level] || "text-foreground";
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-start gap-2 px-2 py-1 rounded",
                        entry.level === "error" && "bg-destructive/5",
                        entry.level === "warn" && "bg-yellow-500/5"
                      )}
                    >
                      <Icon className={cn("w-3 h-3 mt-0.5 shrink-0", colorClass)} />
                      <span className={cn("break-all whitespace-pre-wrap", colorClass)}>
                        {entry.message}
                      </span>
                      <span className="text-muted-foreground/50 shrink-0 ml-auto text-[9px]">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={consoleEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
