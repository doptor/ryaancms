import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, TrendingUp, Layers, Database, Shield,
  Clock, CheckCircle2, XCircle, Sparkles,
} from "lucide-react";

export default function BuildAnalyticsPage() {
  const { user } = useAuth();

  const { data: analytics = [] } = useQuery({
    queryKey: ["build-analytics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("build_analytics")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalBuilds = analytics.length;
  const successBuilds = analytics.filter((a: any) => a.status === "success").length;
  const avgScore = totalBuilds > 0
    ? Math.round(analytics.reduce((sum: number, a: any) => sum + (a.security_score || 0), 0) / totalBuilds)
    : 0;
  const totalComponents = analytics.reduce((sum: number, a: any) => sum + (a.component_count || 0), 0);

  // Component usage frequency
  const componentFrequency: Record<string, number> = {};
  analytics.forEach((a: any) => {
    const comps = a.components_used || [];
    comps.forEach((c: string) => {
      componentFrequency[c] = (componentFrequency[c] || 0) + 1;
    });
  });
  const topComponents = Object.entries(componentFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const stats = [
    { icon: Sparkles, label: "Total Builds", value: totalBuilds, color: "text-primary" },
    { icon: CheckCircle2, label: "Success Rate", value: totalBuilds > 0 ? `${Math.round((successBuilds / totalBuilds) * 100)}%` : "—", color: "text-primary" },
    { icon: Shield, label: "Avg Security", value: avgScore > 0 ? `${avgScore}/100` : "—", color: "text-primary" },
    { icon: Layers, label: "Total Components", value: totalComponents, color: "text-primary" },
  ];

  return (
    <DashboardLayout>
      <ScrollArea className="h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Build Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Track AI Builder generation stats and component usage.</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Top components */}
          {topComponents.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Most Used Components
              </h3>
              <div className="space-y-2">
                {topComponents.map(([name, count]) => {
                  const maxCount = topComponents[0][1] as number;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground font-medium">{name.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground">{count}×</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent builds */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Recent Builds
            </h3>
            {analytics.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No builds yet. Use the AI Builder to generate your first project.</p>
            ) : (
              <div className="space-y-2">
                {analytics.slice(0, 20).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/20 transition-colors">
                    {a.status === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.project_title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.prompt}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">{a.page_count}p · {a.component_count}c</Badge>
                      <Badge variant="outline" className="text-[10px]">🔐 {a.security_score}</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </DashboardLayout>
  );
}
