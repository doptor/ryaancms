import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Download, Star, Puzzle, Layout, Sparkles,
  Upload, FileArchive, Link2, CheckCircle, ArrowRight,
} from "lucide-react";
import { useState, useRef } from "react";
import InstallDialog from "@/components/InstallDialog";

const marketplaceItems = [
  { name: "SEO Pro", type: "Plugin", rating: 4.9, installs: "12.4K", tag: "Popular", desc: "Advanced SEO toolkit with AI-powered suggestions." },
  { name: "E-Commerce Starter", type: "Template", rating: 4.8, installs: "8.2K", tag: "Featured", desc: "Complete storefront with cart, checkout, and product pages." },
  { name: "AI Content Writer", type: "AI Tool", rating: 4.7, installs: "15.1K", tag: "AI", desc: "Generate blog posts, product descriptions, and more." },
  { name: "Analytics Dashboard", type: "Plugin", rating: 4.6, installs: "6.3K", tag: "New", desc: "Real-time analytics with custom dashboards and reports." },
  { name: "SaaS Landing Page", type: "Template", rating: 4.9, installs: "9.8K", tag: "Popular", desc: "Conversion-optimized landing page with pricing tables." },
  { name: "AI Image Tagger", type: "AI Tool", rating: 4.5, installs: "4.1K", tag: "AI", desc: "Auto-tag images with AI for better media management." },
  { name: "Form Builder", type: "Plugin", rating: 4.7, installs: "11.2K", tag: "Popular", desc: "Drag-and-drop form builder with validation and webhooks." },
  { name: "Blog Theme", type: "Template", rating: 4.6, installs: "7.5K", tag: "Featured", desc: "Clean, minimal blog template with dark mode support." },
  { name: "Multi-Language", type: "Plugin", rating: 4.4, installs: "5.9K", tag: "New", desc: "i18n plugin with AI-powered translation support." },
];

const typeFilters = ["All", "Plugins", "Templates", "AI Tools"] as const;

export default function InstallerPage() {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("All");
  const [installItem, setInstallItem] = useState<typeof marketplaceItems[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = marketplaceItems.filter((item) => {
    const matchType =
      activeType === "All" ||
      (activeType === "Plugins" && item.type === "Plugin") ||
      (activeType === "Templates" && item.type === "Template") ||
      (activeType === "AI Tools" && item.type === "AI Tool");
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleInstall = (item: typeof marketplaceItems[0]) => {
    setInstallItem(item);
    setDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file.name);
      setInstallItem({ name: file.name.replace(".rypkg", ""), type: "Plugin", rating: 0, installs: "—", tag: "Local", desc: "Uploaded package" });
      setDialogOpen(true);
    }
  };

  const handleUrlInstall = () => {
    if (!urlInput.trim()) return;
    const name = urlInput.split("/").pop()?.replace(".rypkg", "") || "Package";
    setInstallItem({ name, type: "Plugin", rating: 0, installs: "—", tag: "Remote", desc: `Installed from ${urlInput}` });
    setDialogOpen(true);
    setUrlInput("");
  };

  const typeIcon = (type: string) => {
    if (type === "Plugin") return <Puzzle className="w-4 h-4 text-primary" />;
    if (type === "Template") return <Layout className="w-4 h-4 text-chart-3" />;
    return <Sparkles className="w-4 h-4 text-chart-2" />;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Installer</h1>
            <p className="text-sm text-muted-foreground">Browse, upload, or install plugins & templates for your CMS.</p>
          </div>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="upload">Upload / Import</TabsTrigger>
          </TabsList>

          {/* ─── Marketplace Tab ─── */}
          <TabsContent value="marketplace" className="space-y-6">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search plugins, templates, AI tools..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-1">
                {typeFilters.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeType === t
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-glow transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {item.tag}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-chart-5 fill-chart-5" />
                      {item.rating}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {typeIcon(item.type)}
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">{item.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      <Download className="w-3 h-3 inline mr-1" />
                      {item.installs}
                    </span>
                    <Button variant="hero" size="sm" onClick={() => handleInstall(item)}>
                      <ArrowRight className="w-3.5 h-3.5" /> Install
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground text-sm">
                  No items match your search.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── Upload / Import Tab ─── */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Upload */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileArchive className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Upload .rypkg File</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-xs">
                  Drag & drop or browse to upload a plugin or template package.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".rypkg,.zip"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="hero-outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" /> Browse Files
                </Button>
                {uploadFile && (
                  <p className="text-xs text-chart-4 mt-3 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {uploadFile}
                  </p>
                )}
              </div>

              {/* URL Import */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center mb-4">
                  <Link2 className="w-6 h-6 text-chart-3" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Install from URL</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-xs">
                  Paste a direct link to a .rypkg package or a Git repository URL.
                </p>
                <div className="flex gap-2 w-full max-w-sm">
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/plugin.rypkg"
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button variant="hero" size="sm" onClick={handleUrlInstall}>
                    Install
                  </Button>
                </div>
              </div>
            </div>

            {/* Recent Imports */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">Recent Imports</h3>
              </div>
              <div className="divide-y divide-border">
                {[
                  { name: "custom-auth-plugin", source: "Upload", time: "2 hours ago", status: "Installed" },
                  { name: "portfolio-theme", source: "URL", time: "1 day ago", status: "Installed" },
                  { name: "data-export-tool", source: "Upload", time: "3 days ago", status: "Failed" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Puzzle className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.source} · {item.time}</p>
                      </div>
                    </div>
                    <Badge variant={item.status === "Installed" ? "secondary" : "destructive"} className="text-xs">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <InstallDialog open={dialogOpen} onOpenChange={setDialogOpen} item={installItem} />
      </div>
    </DashboardLayout>
  );
}
