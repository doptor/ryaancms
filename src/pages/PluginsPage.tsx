import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Puzzle, CheckCircle, AlertCircle, Settings, Trash2 } from "lucide-react";

const installedPlugins = [
  { name: "SEO Pro", version: "2.1.0", status: "active", health: "healthy" },
  { name: "AI Content Writer", version: "3.0.2", status: "active", health: "healthy" },
  { name: "Form Builder", version: "1.8.4", status: "active", health: "healthy" },
  { name: "Multi-Language", version: "1.2.0", status: "inactive", health: "warning" },
  { name: "Analytics Dashboard", version: "2.5.1", status: "active", health: "healthy" },
];

export default function PluginsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Installed Plugins</h1>
            <p className="text-sm text-muted-foreground">Manage your active plugins and extensions.</p>
          </div>
          <Button variant="hero" size="sm">
            <Puzzle className="w-4 h-4" /> Browse Marketplace
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_100px_80px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Plugin</span>
            <span>Version</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {installedPlugins.map((plugin) => (
            <div key={plugin.name} className="grid grid-cols-[1fr_100px_100px_80px] gap-4 items-center px-5 py-4 border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <Puzzle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{plugin.name}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">v{plugin.version}</span>
              <div className="flex items-center gap-1.5">
                {plugin.health === "healthy" ? (
                  <CheckCircle className="w-3.5 h-3.5 text-chart-4" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-chart-5" />
                )}
                <span className={`text-xs capitalize ${plugin.status === "active" ? "text-chart-4" : "text-muted-foreground"}`}>
                  {plugin.status}
                </span>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
