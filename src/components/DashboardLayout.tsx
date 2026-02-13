import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, LayoutDashboard, Store, Settings, Zap, ChevronLeft, Download, LogOut, Menu, X, List } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard", color: "text-blue-400" },
  { label: "AI Builder", icon: Sparkles, path: "/dashboard/ai", color: "text-violet-400" },
  { label: "Marketplace", icon: Store, path: "/dashboard/marketplace", color: "text-amber-400" },
  { label: "Installer", icon: Download, path: "/dashboard/installer", color: "text-cyan-400" },
  { label: "Menus", icon: List, path: "/dashboard/menus", color: "text-emerald-400" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings", color: "text-orange-400" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const collapsed = !hovered;

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">RyaanCMS</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground p-1">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-14 left-0 right-0 bottom-0 bg-card border-t border-border overflow-y-auto">
            <nav className="p-3 space-y-0.5">
              {sidebarItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-primary" : item.color)} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-border space-y-0.5">
              <div className="px-4 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
              <button
                onClick={() => { signOut(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-destructive transition-colors w-full rounded-lg hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-5 h-5" /> Back to Site
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
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

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
