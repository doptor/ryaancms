import { useState } from "react";
import { Globe, LayoutGrid, Package, Layers, ChevronDown, ChevronUp, Info, Download, Play, Store, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TargetInfo {
  id: string;
  label: string;
  emoji: string;
  icon: any;
  description: string;
  create: string;
  activate: string;
  use: string;
  download: string;
  marketplace: string;
  dependency: string | null;
  example: string;
}

const BUILD_TARGETS: TargetInfo[] = [
  {
    id: "website",
    label: "Website",
    emoji: "🌐",
    icon: Globe,
    description: "Static or dynamic websites — landing pages, blogs, portfolios, marketing sites.",
    create: "AI Builder → Select 🌐 Website → Describe your site",
    activate: "Deploy Panel → Publish or GitHub Push",
    use: "Preview tab → Live sandboxed URL",
    download: "ZIP Export with full React + Vite source code",
    marketplace: "Share as a Template on the Marketplace for other RyaanCMS users to install",
    dependency: null,
    example: "\"Build a modern portfolio website with hero, projects, about, and contact sections\"",
  },
  {
    id: "application",
    label: "Application",
    emoji: "📱",
    icon: LayoutGrid,
    description: "Full-stack apps — SaaS, dashboards, CRMs, admin panels with backend logic.",
    create: "AI Builder → Select 📱 Application → Describe your app",
    activate: "Deploy Panel → Publish with database & auth",
    use: "Inside dashboard or as standalone app with full CRUD",
    download: "ZIP Export with frontend + backend + database schema",
    marketplace: "Share as an Application on the Marketplace for other RyaanCMS users",
    dependency: null,
    example: "\"Create an inventory management app with products, categories, orders, and role-based access\"",
  },
  {
    id: "plugin",
    label: "Plugin",
    emoji: "🧩",
    icon: Package,
    description: "Modular extensions that add features to an existing Website or Application.",
    create: "AI Builder → Select 🧩 Plugin → Describe the plugin, OR use Plugin Generator Wizard",
    activate: "Marketplace → My Installed → Toggle Active",
    use: "Extends the host app/website — adds pages, APIs, or UI components",
    download: ".rypkg format or ZIP with plugin manifest",
    marketplace: "Submit to Marketplace for review → Available for all RyaanCMS users to install",
    dependency: "⚠️ Requires a host — must declare which Website or Application it extends. Cannot run standalone.",
    example: "\"Build a SEO analytics plugin that adds an SEO dashboard page and meta tag management\"",
  },
  {
    id: "website+application",
    label: "Website + App",
    emoji: "🌐+📱",
    icon: Layers,
    description: "Combined package — public-facing website with a backend application (e.g., e-commerce).",
    create: "AI Builder → Select 🌐+📱 Website + App → Describe both parts",
    activate: "Deploy Panel → Publish as a combined project",
    use: "Website serves public visitors, App handles admin/dashboard with auth",
    download: "ZIP Export with unified frontend + backend + database",
    marketplace: "Share as a combined Template + Application package",
    dependency: null,
    example: "\"Build an e-commerce store with a public storefront and an admin dashboard for order management\"",
  },
  {
    id: "application+plugin",
    label: "App + Plugin",
    emoji: "📱+🧩",
    icon: Layers,
    description: "Application with companion plugin — the plugin extends the app's functionality.",
    create: "AI Builder → Select 📱+🧩 App + Plugin → Describe app and its extension",
    activate: "Deploy Panel for App, then install Plugin from My Installed",
    use: "App runs standalone, Plugin adds optional extra features",
    download: "ZIP Export with app source + separate plugin package",
    marketplace: "App and Plugin listed separately — Plugin declares dependency on the App",
    dependency: "Plugin depends on the Application — users must install the App first",
    example: "\"Build a CRM app with a companion email marketing plugin\"",
  },
  {
    id: "full",
    label: "Full Stack",
    emoji: "🌐+📱+🧩",
    icon: Layers,
    description: "Complete ecosystem — Website + Application + Plugin all generated together.",
    create: "AI Builder → Select 🌐+📱+🧩 Full Stack → Describe the full vision",
    activate: "Deploy all components: Website, App, and Plugin",
    use: "Website for visitors, App for users/admins, Plugin for extensibility",
    download: "ZIP Export with all source code in organized structure",
    marketplace: "All three components available as a bundled ecosystem",
    dependency: "Plugin depends on the Application within the bundle",
    example: "\"Build a complete LMS with a public course catalog website, student/teacher dashboard app, and a quiz plugin\"",
  },
];

export function BuildTargetGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTarget, setExpandedTarget] = useState<string | null>(null);

  return (
    <div className="mt-6 max-w-2xl w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <Info className="w-3.5 h-3.5" />
        <span className="font-medium">What can I build? — Build Target Guide</span>
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-2 animate-fade-in">
          {BUILD_TARGETS.map((target) => (
            <div
              key={target.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedTarget(expandedTarget === target.id ? null : target.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <target.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {target.emoji} {target.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1">
                    {target.description}
                  </div>
                </div>
                {expandedTarget === target.id ? (
                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
              </button>

              {expandedTarget === target.id && (
                <div className="px-3 pb-3 space-y-2 border-t border-border pt-3 animate-fade-in">
                  <Row icon={Play} label="Create" value={target.create} />
                  <Row icon={Play} label="Activate" value={target.activate} />
                  <Row icon={Globe} label="Use" value={target.use} />
                  <Row icon={Download} label="Download" value={target.download} />
                  <Row icon={Store} label="Marketplace" value={target.marketplace} />
                  {target.dependency && (
                    <Row icon={Link2} label="Dependency" value={target.dependency} highlight />
                  )}
                  <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Example Prompt</p>
                    <p className="text-xs text-foreground italic">{target.example}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", highlight ? "text-destructive" : "text-muted-foreground")} />
      <div>
        <span className={cn("text-[11px] font-medium", highlight ? "text-destructive" : "text-muted-foreground")}>{label}: </span>
        <span className={cn("text-[11px]", highlight ? "text-destructive" : "text-foreground")}>{value}</span>
      </div>
    </div>
  );
}
