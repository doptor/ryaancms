import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Zap, LogOut, Menu, X, CircleDot, icons, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";


function getIcon(name: string | null): React.ComponentType<any> {
  if (!name) return CircleDot;
  const icon = (icons as Record<string, any>)[name];
  return icon || CircleDot;
}

const ICON_COLORS = [
  "text-blue-400", "text-violet-400", "text-amber-400", "text-cyan-400",
  "text-emerald-400", "text-orange-400", "text-pink-400", "text-rose-400",
  "text-indigo-400", "text-teal-400",
];

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [topZoneHovered, setTopZoneHovered] = useState(false);
  const [bottomZoneHovered, setBottomZoneHovered] = useState(false);
  const [headerItems, setHeaderItems] = useState<DynamicMenuItem[]>([]);
  const [footerItems, setFooterItems] = useState<DynamicMenuItem[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
    async function fetchProfile() {
      const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user!.id).single();
      if (data?.display_name) setDisplayName(data.display_name);
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    }
    fetchMenus();
    fetchProfile();
  }, [user]);

  const renderItem = (item: DynamicMenuItem, isMobile: boolean, index: number) => {
    const active = location.pathname === item.url;
    const IconComp = getIcon(item.icon);
    const color = ICON_COLORS[index % ICON_COLORS.length];
    const iconSize = isMobile ? "w-5 h-5" : "w-4 h-4";

    return (
      <Link
        key={item.id}
        to={item.url}
        onClick={isMobile ? () => setMobileOpen(false) : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg text-sm transition-colors",
          isMobile ? "px-4 py-2" : "px-3 py-1.5",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <IconComp className={cn(iconSize, "shrink-0", active ? "text-primary" : color)} />
        <span className="whitespace-nowrap">{item.label}</span>
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
              {headerItems.map((item, i) => renderItem(item, true, i))}
            </nav>
            {footerItems.length > 0 && (
              <div className="p-3 border-t border-border space-y-0.5">
                {footerItems.map((item, i) => renderItem(item, true, headerItems.length + i))}
              </div>
            )}
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground truncate flex-1">{displayName || user?.email}</span>
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => { setSidebarHovered(false); setTopZoneHovered(false); setBottomZoneHovered(false); }}
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out overflow-hidden",
          sidebarHovered ? "w-60" : "w-2 cursor-pointer"
        )}
      >
        {sidebarHovered && (
          <>
            {/* Header / Logo */}
            <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground whitespace-nowrap">RyaanCMS</span>
            </div>

            {/* Top zone - header menu items */}
            <div
              className="flex-1 min-h-0"
              onMouseEnter={() => setTopZoneHovered(true)}
              onMouseLeave={() => setTopZoneHovered(false)}
            >
              {topZoneHovered && headerItems.length > 0 && (
                <nav className="p-2 space-y-0.5 animate-in fade-in-0 duration-200">
                  {headerItems.map((item, i) => renderItem(item, false, i))}
                </nav>
              )}
            </div>

            {/* Bottom zone - footer menu items */}
            <div
              className="shrink-0 min-h-[48px] flex items-end"
              onMouseEnter={() => setBottomZoneHovered(true)}
              onMouseLeave={() => setBottomZoneHovered(false)}
            >
              {bottomZoneHovered && footerItems.length > 0 && (
                <div className="p-2 border-t border-border space-y-0.5 animate-in fade-in-0 duration-200 w-full">
                  {footerItems.map((item, i) => renderItem(item, false, headerItems.length + i))}
                </div>
              )}
            </div>

            {/* User section */}
            <div className="p-2 border-t border-border shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground truncate flex-1">
                  {displayName || user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
      

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}