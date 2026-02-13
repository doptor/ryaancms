import { useState } from "react";
import { Zap, Copy, Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

type ApiTab = "rest" | "graphql" | "webhooks";

const restResponse = `{
  "data": [
    {
      "id": "post_01",
      "title": "Getting Started with RyaanCMS",
      "status": "published",
      "author": { "name": "Alex Chen" },
      "created_at": "2026-02-12T10:30:00Z"
    }
  ],
  "meta": { "total": 342, "page": 1, "cached": true, "latency_ms": 12 }
}`;

const graphqlQuery = `query GetPosts {
  posts(where: { status: "published" }, limit: 10) {
    id
    title
    author { name avatar }
    tags { slug }
    created_at
  }
}`;

const webhookPayload = `{
  "event": "entry.published",
  "model": "blog_posts",
  "entry": {
    "id": "post_01",
    "title": "Getting Started with RyaanCMS"
  },
  "timestamp": "2026-02-13T08:15:00Z",
  "signature": "sha256=a1b2c3..."
}`;

const endpoints = [
  { method: "GET", path: "/api/blog-posts", latency: "12ms", cached: true },
  { method: "POST", path: "/api/blog-posts", latency: "45ms", cached: false },
  { method: "GET", path: "/api/products", latency: "8ms", cached: true },
  { method: "DELETE", path: "/api/blog-posts/:id", latency: "32ms", cached: false },
];

export default function PulseDemo() {
  const [tab, setTab] = useState<ApiTab>("rest");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = tab === "rest" ? restResponse : tab === "graphql" ? graphqlQuery : webhookPayload;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">API Explorer</span>
        </div>
        <div className="flex items-center gap-1">
          {(["rest", "graphql", "webhooks"] as ApiTab[]).map((t) => (
            <Button
              key={t}
              variant={tab === t ? "default" : "ghost"}
              size="sm"
              className="h-7 text-[10px] sm:text-xs px-2.5"
              onClick={() => setTab(t)}
            >
              {t === "rest" ? "REST" : t === "graphql" ? "GraphQL" : "Webhooks"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {/* Left: endpoints list */}
        <div className="p-3 space-y-1.5">
          {tab === "rest" && endpoints.map((ep) => (
            <div key={ep.path + ep.method} className="flex items-center justify-between px-3 py-2 rounded-md border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  ep.method === "GET" ? "bg-primary/10 text-primary" :
                  ep.method === "POST" ? "bg-chart-2/20 text-chart-2" :
                  "bg-destructive/10 text-destructive"
                }`}>{ep.method}</span>
                <span className="text-xs font-mono text-muted-foreground">{ep.path}</span>
              </div>
              <div className="flex items-center gap-2">
                {ep.cached && <Zap className="w-3 h-3 text-primary" />}
                <span className="text-[10px] text-muted-foreground">{ep.latency}</span>
              </div>
            </div>
          ))}
          {tab === "graphql" && (
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="px-3 py-2 rounded-md border border-border/50">
                <span className="font-mono text-primary text-[10px]">query</span> GetPosts
              </div>
              <div className="px-3 py-2 rounded-md border border-border/50">
                <span className="font-mono text-chart-2 text-[10px]">mutation</span> CreatePost
              </div>
              <div className="px-3 py-2 rounded-md border border-border/50">
                <span className="font-mono text-accent-foreground text-[10px]">subscription</span> OnPostUpdate
              </div>
            </div>
          )}
          {tab === "webhooks" && (
            <div className="text-xs text-muted-foreground space-y-2">
              {["entry.published", "entry.updated", "entry.deleted", "media.uploaded"].map((ev) => (
                <div key={ev} className="flex items-center justify-between px-3 py-2 rounded-md border border-border/50">
                  <span className="font-mono text-[10px]">{ev}</span>
                  <span className="text-[10px] text-primary">active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: response preview */}
        <div className="relative">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
            <span className="text-[10px] text-muted-foreground">
              {tab === "rest" ? "Response" : tab === "graphql" ? "Query" : "Payload"}
            </span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopy}>
              {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
          <pre className="p-3 text-[10px] leading-relaxed font-mono text-muted-foreground overflow-auto max-h-[220px]">
            {tab === "rest" ? restResponse : tab === "graphql" ? graphqlQuery : webhookPayload}
          </pre>
        </div>
      </div>
    </div>
  );
}
