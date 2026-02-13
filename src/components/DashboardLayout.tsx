import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Database, Sparkles, LayoutDashboard, Store, Settings, Zap, ChevronLeft, Download, Brain, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard", color: "text-blue-400" },
  { label: "Schema Architect", icon: Database, path: "/dashboard/schema", color: "text-emerald-400" },
  { label: "AI Builder", icon: Sparkles, path: "/dashboard/ai", color: "text-violet-400" },
  { label: "AI Integrations", icon: Brain, path: "/dashboard/ai-integrations", color: "text-pink-400" },
  { label: "Marketplace", icon: Store, path: "/dashboard/marketplace", color: "text-amber-400" },
  { label: "Installer", icon: Download, path: "/dashboard/installer", color: "text-cyan-400" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings", color: "text-orange-400" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  const collapsed = !hovered;

  return (
    <div className="flex h-screen bg-background">
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out overflow-hidden",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-foreground whitespace-nowrap">RyaanCMS</span>}
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {sidebarItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : item.color)} />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border space-y-0.5">
          {!collapsed && (
            <div className="px-3 py-1 text-xs text-muted-foreground truncate">
              {user?.email}
            </div>
          )}
          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 shrink-0" /> {!collapsed && "Sign Out"}
          </button>
          <Link to="/" title="Back to Site" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4 shrink-0" /> {!collapsed && "Back to Site"}
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
