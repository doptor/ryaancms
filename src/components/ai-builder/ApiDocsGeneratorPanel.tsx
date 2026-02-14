import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { FileText, Copy, Check, Search, ChevronDown, ChevronRight, Lock, Globe, Send, ArrowRight, Database, Code } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface Props {
  pipelineState: PipelineState | null;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiEndpoint = {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  auth: boolean;
  category: string;
  params?: { name: string; type: string; required: boolean }[];
  responseExample?: string;
};

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  POST: "bg-primary/15 text-primary border-primary/30",
  PUT: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  PATCH: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  DELETE: "bg-destructive/15 text-destructive border-destructive/30",
};

export function ApiDocsGeneratorPanel({ pipelineState }: Props) {
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const config = pipelineState?.config;

  const endpoints = useMemo<ApiEndpoint[]>(() => {
    if (!config) return [];
    const eps: ApiEndpoint[] = [];

    // Auth endpoints
    eps.push(
      { id: "auth-register", method: "POST", path: "/api/auth/register", description: "Register a new user account", auth: false, category: "Authentication", params: [{ name: "email", type: "string", required: true }, { name: "password", type: "string", required: true }, { name: "name", type: "string", required: false }], responseExample: '{ "user": { "id": "uuid", "email": "user@example.com" }, "token": "jwt..." }' },
      { id: "auth-login", method: "POST", path: "/api/auth/login", description: "Login with email and password", auth: false, category: "Authentication", params: [{ name: "email", type: "string", required: true }, { name: "password", type: "string", required: true }], responseExample: '{ "user": { "id": "uuid" }, "token": "jwt..." }' },
      { id: "auth-me", method: "GET", path: "/api/auth/me", description: "Get current authenticated user profile", auth: true, category: "Authentication", responseExample: '{ "id": "uuid", "email": "user@example.com", "role": "admin" }' },
      { id: "auth-logout", method: "POST", path: "/api/auth/logout", description: "Logout and invalidate session", auth: true, category: "Authentication" },
    );

    // Generate CRUD endpoints from collections
    const collections = config.collections || [];
    for (const col of collections) {
      const name = col.name.toLowerCase();
      const singular = name.endsWith("s") ? name.slice(0, -1) : name;
      eps.push(
        { id: `${name}-list`, method: "GET", path: `/api/${name}`, description: `List all ${name} with pagination and filters`, auth: true, category: col.name, params: [{ name: "page", type: "number", required: false }, { name: "limit", type: "number", required: false }, { name: "search", type: "string", required: false }], responseExample: `{ "data": [...], "total": 100, "page": 1, "limit": 20 }` },
        { id: `${name}-get`, method: "GET", path: `/api/${name}/:id`, description: `Get a single ${singular} by ID`, auth: true, category: col.name, params: [{ name: "id", type: "string", required: true }], responseExample: `{ "id": "uuid", ...${singular}Fields }` },
        { id: `${name}-create`, method: "POST", path: `/api/${name}`, description: `Create a new ${singular}`, auth: true, category: col.name, params: (col.fields || []).map((f: any) => ({ name: f.name, type: f.type, required: f.required !== false })), responseExample: `{ "id": "uuid", "created_at": "..." }` },
        { id: `${name}-update`, method: "PUT", path: `/api/${name}/:id`, description: `Update an existing ${singular}`, auth: true, category: col.name, params: [{ name: "id", type: "string", required: true }] },
        { id: `${name}-delete`, method: "DELETE", path: `/api/${name}/:id`, description: `Delete a ${singular}`, auth: true, category: col.name, params: [{ name: "id", type: "string", required: true }] },
      );
    }

    // Generate page-based endpoints
    for (const page of config.pages || []) {
      const slug = page.route?.replace(/^\//, "") || page.name?.toLowerCase().replace(/\s+/g, "-");
      if (slug && !eps.some(e => e.path.includes(slug))) {
        eps.push({
          id: `page-${slug}`,
          method: "GET",
          path: `/api/pages/${slug}`,
          description: `Get ${page.name || slug} page data`,
          auth: false,
          category: "Pages",
        });
      }
    }

    return eps;
  }, [config]);

  const categories = useMemo(() => {
    const cats = new Set(endpoints.map(e => e.category));
    return Array.from(cats);
  }, [endpoints]);

  const filtered = endpoints.filter(e =>
    !search || e.path.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyEndpoint = (ep: ApiEndpoint) => {
    const curlCmd = `curl -X ${ep.method} "${ep.path}"${ep.auth ? ' \\\n  -H "Authorization: Bearer <token>"' : ""}${ep.method === "POST" || ep.method === "PUT" ? ' \\\n  -H "Content-Type: application/json" \\\n  -d \'{}\'': ""}`;
    navigator.clipboard.writeText(curlCmd);
    setCopiedId(ep.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportOpenAPI = () => {
    const spec = {
      openapi: "3.0.0",
      info: { title: config?.title || "API", version: "1.0.0", description: `API documentation for ${config?.title}` },
      paths: Object.fromEntries(
        endpoints.map(ep => [ep.path, { [ep.method.toLowerCase()]: { summary: ep.description, tags: [ep.category], security: ep.auth ? [{ bearerAuth: [] }] : [] } }])
      ),
    };
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "openapi-spec.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "📄 OpenAPI spec exported!" });
  };

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">API Documentation</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to auto-generate API docs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">API Documentation</h3>
              <p className="text-[11px] text-muted-foreground">{endpoints.length} endpoints · {categories.length} categories</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={exportOpenAPI} className="gap-1 text-xs">
            <Code className="w-3 h-3" /> OpenAPI
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search endpoints..." className="pl-8 text-xs h-8" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {categories.map((cat) => {
            const catEndpoints = filtered.filter(e => e.category === cat);
            if (catEndpoints.length === 0) return null;
            return (
              <div key={cat} className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Database className="w-3 h-3" /> {cat}
                  <Badge variant="outline" className="text-[9px] h-4 ml-1">{catEndpoints.length}</Badge>
                </p>
                {catEndpoints.map((ep) => {
                  const isExpanded = expandedIds.has(ep.id);
                  return (
                    <div key={ep.id} className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => toggleExpand(ep.id)}
                        className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-accent/50 transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                        <Badge variant="outline" className={cn("text-[9px] font-mono px-1.5 shrink-0", METHOD_COLORS[ep.method])}>
                          {ep.method}
                        </Badge>
                        <code className="text-xs font-mono text-foreground truncate flex-1">{ep.path}</code>
                        {ep.auth && <Lock className="w-3 h-3 text-chart-4 shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border p-3 space-y-2.5 bg-muted/30">
                          <p className="text-xs text-muted-foreground">{ep.description}</p>

                          {ep.auth && (
                            <div className="flex items-center gap-1.5 text-[10px] text-chart-4">
                              <Lock className="w-3 h-3" /> Requires authentication (Bearer token)
                            </div>
                          )}

                          {ep.params && ep.params.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Parameters</p>
                              {ep.params.map((p) => (
                                <div key={p.name} className="flex items-center gap-2 text-xs">
                                  <code className="font-mono text-foreground">{p.name}</code>
                                  <Badge variant="outline" className="text-[9px] h-4">{p.type}</Badge>
                                  {p.required && <Badge variant="secondary" className="text-[9px] h-4 text-destructive">required</Badge>}
                                </div>
                              ))}
                            </div>
                          )}

                          {ep.responseExample && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Response Example</p>
                              <pre className="text-[10px] font-mono bg-background rounded p-2 border border-border overflow-x-auto text-foreground">
                                {ep.responseExample}
                              </pre>
                            </div>
                          )}

                          <Button size="sm" variant="ghost" onClick={() => copyEndpoint(ep)} className="gap-1 text-xs h-7">
                            {copiedId === ep.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy cURL
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">No endpoints match your search.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
