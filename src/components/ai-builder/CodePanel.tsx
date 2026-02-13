import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileCode2, Copy, Check, Download, Loader2,
  Sparkles, ChevronRight, FolderDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface GeneratedFile {
  filename: string;
  pageName: string;
  route: string;
  code: string;
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

  const activeFile = files.find((f) => f.filename === selectedFile) || files[0] || null;

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
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    for (const file of files) {
      handleDownloadFile(file.filename, file.code);
    }
    toast({ title: "Downloaded!", description: `${files.length} files downloaded.` });
  };

  // No config yet
  if (!hasConfig) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileCode2 className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Code Generator</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Build an app config first, then generate real React/Tailwind code.
          </p>
        </div>
      </div>
    );
  }

  // Config exists but no code generated yet
  if (files.length === 0 && !isGenerating) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Generate React Code</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Transform your app configuration into real, deployable React components with Tailwind CSS.
          </p>
          <Button onClick={onGenerate} className="gap-2">
            <Sparkles className="w-4 h-4" /> Generate Code
          </Button>
        </div>
      </div>
    );
  }

  // Generating
  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
          <h3 className="text-lg font-semibold text-foreground">Generating Code...</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            AI is converting your configuration into React components. This may take a moment.
          </p>
          {files.length > 0 && (
            <p className="text-xs text-primary">{files.length} file(s) generated so far...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* File sidebar */}
      <div className="w-52 border-r border-border bg-card shrink-0 flex flex-col">
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Files ({files.length})</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleDownloadAll}>
            <FolderDown className="w-3.5 h-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {files.map((f) => (
              <button
                key={f.filename}
                onClick={() => setSelectedFile(f.filename)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-all",
                  (selectedFile || files[0]?.filename) === f.filename
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{f.filename}</div>
                  <div className="text-[10px] opacity-70 truncate">{f.route}</div>
                </div>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-border">
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
                <span className="text-sm font-medium text-foreground">{activeFile.filename}</span>
                <Badge variant="secondary" className="text-[10px] h-4">{activeFile.pageName}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => handleCopy(activeFile.filename, activeFile.code)}
                >
                  {copiedFile === activeFile.filename ? (
                    <><Check className="w-3 h-3 text-primary" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => handleDownloadFile(activeFile.filename, activeFile.code)}
                >
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
