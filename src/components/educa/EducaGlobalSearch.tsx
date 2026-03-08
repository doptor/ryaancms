import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap, Users, Building2, BookOpen, FileText, TrendingUp, Plane, Command } from "lucide-react";

const MODULE_CONFIG = [
  { key: "students", table: "educa_students" as const, icon: GraduationCap, label: "Students", fields: ["name", "email", "nationality", "preferred_country"], href: "/dashboard/educa/students", color: "text-blue-500" },
  { key: "agents", table: "educa_agents" as const, icon: Users, label: "Agents", fields: ["name", "company", "email", "country"], href: "/dashboard/educa/agents", color: "text-green-500" },
  { key: "universities", table: "educa_universities" as const, icon: Building2, label: "Universities", fields: ["name", "country", "city"], href: "/dashboard/educa/universities", color: "text-purple-500" },
  { key: "courses", table: "educa_courses" as const, icon: BookOpen, label: "Courses", fields: ["course_name", "course_code"], href: "/dashboard/educa/courses", color: "text-orange-500" },
  { key: "leads", table: "educa_leads" as const, icon: TrendingUp, label: "Leads", fields: ["name", "email", "phone"], href: "/dashboard/educa/leads", color: "text-cyan-500" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EducaGlobalSearch({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); onOpenChange(true); }
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  // Search across modules
  const { data: results, isLoading } = useQuery({
    queryKey: ["educa_global_search", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const q = query.toLowerCase();
      const all: { module: string; icon: any; label: string; name: string; subtitle: string; href: string; color: string }[] = [];

      await Promise.all(MODULE_CONFIG.map(async (mod) => {
        const { data } = await supabase.from(mod.table).select("*").limit(5);
        if (!data) return;
        const matches = data.filter(row => mod.fields.some(f => (row as any)[f]?.toLowerCase?.()?.includes(q)));
        matches.forEach(row => {
          const name = (row as any).name || (row as any).course_name || "Untitled";
          const sub = mod.fields.slice(1).map(f => (row as any)[f]).filter(Boolean).join(" · ");
          all.push({ module: mod.key, icon: mod.icon, label: mod.label, name, subtitle: sub, href: mod.href, color: mod.color });
        });
      }));

      return all;
    },
    enabled: !!user && query.length >= 2,
    staleTime: 500,
  });

  const goTo = (href: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(href);
  };

  const grouped = (results ?? []).reduce((acc, r) => {
    if (!acc[r.module]) acc[r.module] = { label: r.label, icon: r.icon, color: r.color, items: [] };
    acc[r.module].items.push(r);
    return acc;
  }, {} as Record<string, { label: string; icon: any; color: string; items: typeof results }>);

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setQuery(""); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input className="border-0 shadow-none focus-visible:ring-0 text-base h-12 px-0" placeholder="Search students, agents, universities, courses, leads..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-0.5 rounded border bg-muted px-1.5 text-xs text-muted-foreground">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.length < 2 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Type at least 2 characters to search across all EDUCA modules</div>
          ) : isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Searching...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No results for "{query}"</div>
          ) : (
            Object.entries(grouped).map(([key, group]) => (
              <div key={key} className="mb-2">
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                  <group.icon className={`w-3.5 h-3.5 ${group.color}`} />{group.label}
                  <Badge variant="secondary" className="ml-auto text-xs h-4 px-1">{group.items.length}</Badge>
                </div>
                {group.items.map((item, i) => (
                  <button key={i} className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-left transition-colors" onClick={() => goTo(item.href)}>
                    <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      {item.subtitle && <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>}
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
