import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Search, Download, Star, Puzzle, Layout, Sparkles } from "lucide-react";
import { useState } from "react";

const tabs = ["All", "Plugins", "Templates", "AI Tools"] as const;

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

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("All");
  const [search, setSearch] = useState("");

  const filtered = marketplaceItems.filter((item) => {
    const matchTab = activeTab === "All" || item.type === activeTab.replace("s", "").replace("AI Tool", "AI Tool");
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Discover plugins, templates, and AI tools for your CMS.</p>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search marketplace..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.name} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-glow transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">{item.tag}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-chart-5 fill-chart-5" />
                  {item.rating}
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {item.type === "Plugin" ? <Puzzle className="w-4 h-4 text-primary" /> : item.type === "Template" ? <Layout className="w-4 h-4 text-accent-foreground" /> : <Sparkles className="w-4 h-4 text-primary" />}
                <h3 className="font-semibold text-foreground">{item.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{item.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground"><Download className="w-3 h-3 inline mr-1" />{item.installs}</span>
                <Button variant="hero-outline" size="sm">Install</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
