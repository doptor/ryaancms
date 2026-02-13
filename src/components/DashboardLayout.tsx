import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Zap, ChevronLeft, LogOut, Menu, X, CircleDot, icons } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

function getIcon(name: string | null): React.ComponentType<any> {
  if (!name) return CircleDot;
  const icon = (icons as Record<string, any>)[name];
  return icon || CircleDot;
}

interface DynamicMenuItem {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

interface DynamicMenuGroup {
  id: string;
  name: string;
  position: string;
  is_active: boolean;
  items: DynamicMenuItem[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerItems, setHeaderItems] = useState<DynamicMenuItem[]>([]);
  const [footerItems, setFooterItems] = useState<DynamicMenuItem[]>([]);

  const collapsed = !hovered;

  useEffect(() => {
    if (!user) return;
    async function fetchMenus() {
      const { data: groups } = await supabase
        .from("menu_groups")
        .select("*")
        .in("position", ["dashboard-header", "dashboard-footer"])
        .eq("target", "dashboard")
        .eq("is_active", true)
        .order("sort_order");

      if (!groups || groups.length === 0) return;

      const { data: items } = await supabase
        .from("menu_items")
        .select("*")
        .in("group_id", groups.map(g => g.id))
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order");

      if (!items) return;

      const headerGroupIds = groups.filter(g => g.position === "dashboard-header").map(g => g.id);
      const footerGroupIds = groups.filter(g => g.position === "dashboard-footer").map(g => g.id);

      setHeaderItems(items.filter(i => headerGroupIds.includes(i.group_id)).map(i => ({
        id: i.id, label: i.label, url: i.url || "/dashboard", icon: i.icon, sort_order: i.sort_order, is_active: i.is_active,
      })));
      setFooterItems(items.filter(i => footerGroupIds.includes(i.group_id)).map(i => ({
        id: i.id, label: i.label, url: i.url || "/dashboard", icon: i.icon, sort_order: i.sort_order, is_active: i.is_active,
      })));
    }
    fetchMenus();
  }, [user]);

  const renderItem = (item: DynamicMenuItem, isMobile: boolean) => {
    const active = location.pathname === item.url;
    const IconComp = getIcon(item.icon);
    const color = "text-muted-foreground";
    const iconSize = isMobile ? "w-5 h-5" : "w-4 h-4";

    return (
      <Link
        key={item.id}
        to={item.url}
        title={item.label}
        onClick={isMobile ? () => setMobileOpen(false) : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg text-sm transition-colors",
          isMobile ? "px-4 py-3" : "px-3 py-2",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <IconComp className={cn(iconSize, "shrink-0", active ? "text-primary" : color)} />
        {(isMobile || !collapsed) && <span className="whitespace-nowrap">{item.label}</span>}
      </Link>
    );
  };

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
          <div className="absolute top-14 left-0 right-0 bottom-0 bg-card border-t border-border overflow-y-auto flex flex-col">
            <nav className="p-3 space-y-0.5 flex-1">
              {headerItems.map(item => renderItem(item, true))}
            </nav>
            {footerItems.length > 0 && (
              <div className="p-3 border-t border-border space-y-0.5">
                {footerItems.map(item => renderItem(item, true))}
              </div>
            )}
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
          {headerItems.map(item => renderItem(item, false))}
        </nav>
        {footerItems.length > 0 && (
          <div className="p-2 border-t border-border space-y-0.5">
            {footerItems.map(item => renderItem(item, false))}
          </div>
        )}
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