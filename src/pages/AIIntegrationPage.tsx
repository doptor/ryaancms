import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Brain, CheckCircle2, XCircle, MoreHorizontal } from "lucide-react";

// --- Types ---
type AIStatus = "active" | "inactive" | "error";
type AIProvider = "openai" | "gemini" | "anthropic" | "mistral" | "custom";

interface AIIntegration {
  id: string;
  name: string;
  provider: AIProvider;
  model: string;
  apiEndpoint: string;
  apiKey: string;
  status: AIStatus;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
}

// --- Seed data ---
const seedData: AIIntegration[] = [
  { id: "1", name: "Content Writer", provider: "openai", model: "gpt-4o", apiEndpoint: "https://api.openai.com/v1", apiKey: "sk-...abc1", status: "active", usageCount: 12480, lastUsed: "2026-02-13", createdAt: "2025-11-01" },
  { id: "2", name: "Schema Generator", provider: "gemini", model: "gemini-2.5-pro", apiEndpoint: "https://generativelanguage.googleapis.com", apiKey: "AIza...xyz2", status: "active", usageCount: 3210, lastUsed: "2026-02-12", createdAt: "2025-12-15" },
  { id: "3", name: "SEO Optimizer", provider: "anthropic", model: "claude-3-opus", apiEndpoint: "https://api.anthropic.com/v1", apiKey: "sk-ant...def3", status: "inactive", usageCount: 870, lastUsed: "2026-01-28", createdAt: "2026-01-05" },
  { id: "4", name: "Image Tagger", provider: "gemini", model: "gemini-2.5-flash", apiEndpoint: "https://generativelanguage.googleapis.com", apiKey: "AIza...ghi4", status: "active", usageCount: 5640, lastUsed: "2026-02-13", createdAt: "2025-10-20" },
  { id: "5", name: "Layout AI", provider: "openai", model: "gpt-4o-mini", apiEndpoint: "https://api.openai.com/v1", apiKey: "sk-...jkl5", status: "error", usageCount: 142, lastUsed: "2026-02-10", createdAt: "2026-02-01" },
  { id: "6", name: "Workflow Bot", provider: "mistral", model: "mistral-large", apiEndpoint: "https://api.mistral.ai/v1", apiKey: "mist-...mno6", status: "active", usageCount: 980, lastUsed: "2026-02-11", createdAt: "2026-01-18" },
  { id: "7", name: "Translation Engine", provider: "openai", model: "gpt-4o", apiEndpoint: "https://api.openai.com/v1", apiKey: "sk-...pqr7", status: "active", usageCount: 7320, lastUsed: "2026-02-13", createdAt: "2025-09-10" },
  { id: "8", name: "Code Assistant", provider: "anthropic", model: "claude-3.5-sonnet", apiEndpoint: "https://api.anthropic.com/v1", apiKey: "sk-ant...stu8", status: "inactive", usageCount: 410, lastUsed: "2026-02-05", createdAt: "2026-01-22" },
  { id: "9", name: "Custom Embeddings", provider: "custom", model: "e5-large-v2", apiEndpoint: "https://my-ml.example.com/embed", apiKey: "cust-...vwx9", status: "active", usageCount: 15200, lastUsed: "2026-02-13", createdAt: "2025-08-01" },
  { id: "10", name: "Sentiment Analyzer", provider: "mistral", model: "mistral-medium", apiEndpoint: "https://api.mistral.ai/v1", apiKey: "mist-...yza0", status: "active", usageCount: 2100, lastUsed: "2026-02-12", createdAt: "2026-01-10" },
  { id: "11", name: "Spam Filter", provider: "custom", model: "spam-bert-v3", apiEndpoint: "https://ml.example.com/spam", apiKey: "cust-...b11", status: "active", usageCount: 44000, lastUsed: "2026-02-13", createdAt: "2025-06-15" },
  { id: "12", name: "Summarizer", provider: "openai", model: "gpt-4o-mini", apiEndpoint: "https://api.openai.com/v1", apiKey: "sk-...c12", status: "error", usageCount: 56, lastUsed: "2026-02-09", createdAt: "2026-02-08" },
];

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Google Gemini" },
  { value: "anthropic", label: "Anthropic" },
  { value: "mistral", label: "Mistral" },
  { value: "custom", label: "Custom" },
];

const PAGE_SIZE = 6;

const statusConfig: Record<AIStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", icon: CheckCircle2, variant: "default" },
  inactive: { label: "Inactive", icon: XCircle, variant: "secondary" },
  error: { label: "Error", icon: XCircle, variant: "destructive" },
};

const emptyForm = (): Omit<AIIntegration, "id" | "usageCount" | "lastUsed" | "createdAt"> => ({
  name: "", provider: "openai", model: "", apiEndpoint: "", apiKey: "", status: "active",
});

export default function AIIntegrationPage() {
  const [items, setItems] = useState<AIIntegration[]>(seedData);
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- Filtering & pagination ---
  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.model.toLowerCase().includes(search.toLowerCase());
    const matchProvider = filterProvider === "all" || i.provider === filterProvider;
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchSearch && matchProvider && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // --- CRUD ---
  const openCreate = () => {
    setForm(emptyForm());
    setDialogMode("create");
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (item: AIIntegration) => {
    setForm({ name: item.name, provider: item.provider, model: item.model, apiEndpoint: item.apiEndpoint, apiKey: item.apiKey, status: item.status });
    setDialogMode("edit");
    setEditId(item.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.model.trim()) return;
    if (dialogMode === "create") {
      const newItem: AIIntegration = {
        ...form,
        id: crypto.randomUUID(),
        usageCount: 0,
        lastUsed: "-",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setItems((prev) => [newItem, ...prev]);
    } else if (editId) {
      setItems((prev) => prev.map((i) => (i.id === editId ? { ...i, ...form } : i)));
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
    if (paged.length === 1 && safePage > 1) setPage(safePage - 1);
  };

  // --- Pagination helpers ---
  const pageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" /> AI Integrations
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage AI platform connections, models, and API keys.</p>
            <p className="text-xs text-destructive/80 mt-1.5">⚠️ You must configure API keys for all agents to enable the full AI Builder pipeline. Without them, your content build will be incomplete.</p>
          </div>
          <Button variant="hero" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Integration
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or model…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={filterProvider} onValueChange={(v) => { setFilterProvider(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Provider" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No integrations found.
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((item) => {
                  const sc = statusConfig[item.status];
                  const StatusIcon = sc.icon;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{item.provider}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">{item.model}</TableCell>
                      <TableCell>
                        <Badge variant={sc.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" /> {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{item.usageCount.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{item.lastUsed}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={safePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {pageNumbers().map((n, i) =>
                n === "ellipsis" ? (
                  <PaginationItem key={`e${i}`}><PaginationEllipsis /></PaginationItem>
                ) : (
                  <PaginationItem key={n}>
                    <PaginationLink isActive={n === safePage} onClick={() => setPage(n as number)} className="cursor-pointer">
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={safePage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <p className="text-xs text-muted-foreground">
          Showing {paged.length} of {filtered.length} integration{filtered.length !== 1 && "s"}
        </p>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Add AI Integration" : "Edit Integration"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "create" ? "Connect a new AI platform to RyaanCMS." : "Update integration details."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="ai-name">Name</Label>
              <Input id="ai-name" placeholder="e.g. Content Writer" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v as AIProvider })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AIStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ai-model">Model</Label>
              <Input id="ai-model" placeholder="e.g. gpt-4o" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ai-endpoint">API Endpoint</Label>
              <Input id="ai-endpoint" placeholder="https://api.openai.com/v1" value={form.apiEndpoint} onChange={(e) => setForm({ ...form, apiEndpoint: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ai-key">API Key</Label>
              <Input id="ai-key" type="password" placeholder="sk-..." value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="hero" onClick={handleSave}>{dialogMode === "create" ? "Create" : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Integration</DialogTitle>
            <DialogDescription>This action cannot be undone. The integration and its configuration will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
