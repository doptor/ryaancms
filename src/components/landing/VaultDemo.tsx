import { useState, forwardRef } from "react";
import { History, RotateCcw, ChevronRight, Database, GitBranch, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Version {
  id: string;
  label: string;
  time: string;
  author: string;
  changes: string[];
  type: "schema" | "content" | "plugin";
}

const versions: Version[] = [
  {
    id: "v6", label: "v2.4.0", time: "2 min ago", author: "You",
    type: "schema",
    changes: ["+  slug TEXT UNIQUE NOT NULL", "+  seo_title TEXT", "+  INDEX idx_posts_slug"],
  },
  {
    id: "v5", label: "v2.3.1", time: "1 hour ago", author: "Alex",
    type: "content",
    changes: ["~  status: draft → published", "~  title: 'Draft Post' → 'Getting Started'"],
  },
  {
    id: "v4", label: "v2.3.0", time: "3 hours ago", author: "Sara",
    type: "schema",
    changes: ["+  author_id UUID REFERENCES users(id)", "+  POLICY users_own_posts"],
  },
  {
    id: "v3", label: "v2.2.0", time: "Yesterday", author: "You",
    type: "plugin",
    changes: ["+  Installed seo-pro@1.2.0", "+  Installed analytics@0.9.1"],
  },
  {
    id: "v2", label: "v2.1.0", time: "2 days ago", author: "Alex",
    type: "schema",
    changes: ["+  CREATE TABLE blog_posts", "+  CREATE TABLE categories", "+  ENABLE RLS"],
  },
];

const typeColors: Record<string, string> = {
  schema: "bg-primary/10 text-primary",
  content: "bg-chart-2/20 text-chart-2",
  plugin: "bg-accent text-accent-foreground",
};

const VaultDemo = forwardRef<HTMLDivElement>(function VaultDemo(_props, ref) {
  const [selected, setSelected] = useState<string>("v6");
  const [rolledBack, setRolledBack] = useState(false);

  const activeVersion = versions.find((v) => v.id === selected)!;

  const handleRollback = () => {
    setRolledBack(true);
    setTimeout(() => setRolledBack(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Time Machine</span>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">main · {versions.length} versions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {/* Timeline */}
        <div className="p-3 space-y-1 max-h-[260px] overflow-y-auto">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                selected === v.id
                  ? "bg-primary/10 border border-primary/30"
                  : "border border-transparent hover:bg-accent/50"
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${selected === v.id ? "bg-primary" : "bg-border"}`} />
                {v.id !== "v2" && <div className="w-px h-4 bg-border mt-1" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{v.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${typeColors[v.type]}`}>{v.type}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{v.author} · {v.time}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/50 transition-transform ${selected === v.id ? "rotate-90" : ""}`} />
            </button>
          ))}
        </div>

        {/* Diff view */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-[10px] text-muted-foreground">Changes in {activeVersion.label}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 gap-1"
              onClick={handleRollback}
              disabled={rolledBack}
            >
              {rolledBack ? (
                <><Check className="w-3 h-3 text-primary" /> Restored</>
              ) : (
                <><RotateCcw className="w-3 h-3" /> Rollback</>
              )}
            </Button>
          </div>
          <div className="p-3 font-mono text-[10px] leading-relaxed space-y-1">
            {activeVersion.changes.map((line, i) => (
              <div
                key={i}
                className={`px-2 py-1 rounded ${
                  line.startsWith("+") ? "bg-primary/5 text-primary" :
                  line.startsWith("-") ? "bg-destructive/5 text-destructive" :
                  "bg-chart-5/10 text-chart-5"
                }`}
              >
                {line}
              </div>
            ))}
          </div>
          <div className="px-3 pb-3">
            <div className="rounded-md border border-border/50 p-2 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Schema checksum: <span className="text-foreground font-mono">a3f8c2d</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default VaultDemo;
