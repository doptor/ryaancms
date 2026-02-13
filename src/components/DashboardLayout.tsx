import { Link, useLocation } from "react-router-dom";
import { Database, Puzzle, Sparkles, LayoutDashboard, Store, Settings, Zap, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Schema Architect", icon: Database, path: "/dashboard/schema" },
  { label: "AI Builder", icon: Sparkles, path: "/dashboard/ai" },
  { label: "Marketplace", icon: Store, path: "/dashboard/marketplace" },
  { label: "Plugins", icon: Puzzle, path: "/dashboard/plugins" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">RyaanCMS</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Site
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
