import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileCode2, Copy, Check, Download, Loader2,
  Sparkles, ChevronRight, FolderDown, Package, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { MODULE_TEMPLATES, COMPONENT_TEMPLATE_MAP } from "@/lib/engine/module-templates";

export interface GeneratedFile {
  filename: string;
  pageName: string;
  route: string;
  code: string;
  isTemplate?: boolean;
}

interface CodePanelProps {
  files: GeneratedFile[];
  isGenerating: boolean;
  onGenerate: () => void;
  hasConfig: boolean;
}

export function CodePanel({ files, isGenerating, onGenerate, hasConfig }: CodePanelProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // For template files, replace with actual template code
  const resolvedFiles = files.map((f) => {
    if (f.isTemplate && f.code.startsWith("// Template:")) {
      const typeMatch = f.code.match(/^\/\/ Template: (.+)$/m);
      const componentType = typeMatch?.[1]?.trim();
      if (componentType) {
        const templateId = COMPONENT_TEMPLATE_MAP[componentType];
        const template = MODULE_TEMPLATES.find((t) => t.id === templateId);
        if (template) {
          return { ...f, code: template.code };
        }
      }
    }
    return f;
  });

  // Separate page files from scaffold files
  const pageFiles = resolvedFiles.filter((f) => !f.filename.startsWith("_scaffold/"));
  const scaffoldFiles = resolvedFiles.filter((f) => f.filename.startsWith("_scaffold/"));

  const allDisplayFiles = [...pageFiles, ...scaffoldFiles];
  const activeFile = allDisplayFiles.find((f) => f.filename === selectedFile) || allDisplayFiles[0] || null;

  const handleCopy = (filename: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 1500);
    toast({ title: "Copied!", description: `${filename} copied to clipboard.` });
  };

  const handleDownloadFile = (filename: string, code: string) => {
    const blob = new Blob([code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace("_scaffold/", "");
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();

    for (const file of resolvedFiles) {
      let path = file.filename;
      if (path.startsWith("_scaffold/")) {
        path = path.replace("_scaffold/", "");
      } else if (path === "App.tsx") {
        path = "src/App.tsx";
      } else {
        path = `src/pages/${path}`;
      }
      zip.file(path, file.code);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project.zip";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "📦 ZIP Downloaded!", description: `${resolvedFiles.length} files in project.zip` });
  };

  if (!hasConfig) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileCode2 className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Code Generator</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app config first, then generate real React/Tailwind code.</p>
        </div>
      </div>
    );
  }

  if (files.length === 0 && !isGenerating) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Generate React Code</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Transform your config into deployable React + Tailwind code with full project scaffold.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Module Templates</span>
            <span className="flex items-center gap-1"><Package className="w-3 h-3" /> ZIP Export</span>
          </div>
          <Button onClick={onGenerate} className="gap-2">
            <Sparkles className="w-4 h-4" /> Generate Code
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
          <p className="text-sm text-muted-foreground max-w-sm">
            AI is generating React components. Template modules are applied instantly.
          </p>
          {files.length > 0 && <p className="text-xs text-primary">{files.length} file(s) so far...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* File sidebar */}
      <div className="w-56 border-r border-border bg-card shrink-0 flex flex-col">
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Files ({allDisplayFiles.length})</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleDownloadZip} title="Download ZIP">
              <Package className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {pageFiles.length > 0 && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2.5 pt-2 pb-1">Pages</p>
            )}
            {pageFiles.map((f) => (
              <button
                key={f.filename}
                onClick={() => setSelectedFile(f.filename)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-all",
                  (selectedFile || allDisplayFiles[0]?.filename) === f.filename
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate flex items-center gap-1">
                    {f.filename}
                    {f.isTemplate && <Badge variant="secondary" className="text-[8px] h-3 px-1">TPL</Badge>}
                  </div>
                  <div className="text-[10px] opacity-70 truncate">{f.route}</div>
                </div>
              </button>
            ))}
            {scaffoldFiles.length > 0 && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2.5 pt-3 pb-1">Project Scaffold</p>
            )}
            {scaffoldFiles.map((f) => (
              <button
                key={f.filename}
                onClick={() => setSelectedFile(f.filename)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-all",
                  selectedFile === f.filename
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Package className="w-3 h-3 shrink-0" />
                <span className="truncate">{f.filename.replace("_scaffold/", "")}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-border space-y-1.5">
          <Button variant="default" size="sm" onClick={handleDownloadZip} className="w-full gap-1.5 text-xs h-8">
            <Package className="w-3 h-3" /> Download ZIP
          </Button>
          <Button variant="outline" size="sm" onClick={onGenerate} className="w-full gap-1.5 text-xs h-8">
            <Sparkles className="w-3 h-3" /> Regenerate
          </Button>
        </div>
      </div>

      {/* Code view */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeFile && (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {activeFile.filename.replace("_scaffold/", "")}
                </span>
                <Badge variant="secondary" className="text-[10px] h-4">{activeFile.pageName}</Badge>
                {activeFile.isTemplate && (
                  <Badge variant="outline" className="text-[10px] h-4 gap-0.5">
                    <Layers className="w-2.5 h-2.5" /> Template
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                  onClick={() => handleCopy(activeFile.filename, activeFile.code)}>
                  {copiedFile === activeFile.filename ? (
                    <><Check className="w-3 h-3 text-primary" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                  onClick={() => handleDownloadFile(activeFile.filename, activeFile.code)}>
                  <Download className="w-3 h-3" /> Download
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <pre className="p-4 text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap break-all">
                {activeFile.code}
              </pre>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
