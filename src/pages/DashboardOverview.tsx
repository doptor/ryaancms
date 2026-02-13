import DashboardLayout from "@/components/DashboardLayout";
import { Database, Users, Puzzle, Globe, TrendingUp, Clock } from "lucide-react";

const stats = [
  { label: "Collections", value: "12", icon: Database, change: "+2 this week" },
  { label: "Active Users", value: "1,847", icon: Users, change: "+12% growth" },
  { label: "Plugins", value: "8", icon: Puzzle, change: "All healthy" },
  { label: "API Calls", value: "284K", icon: Globe, change: "< 45ms avg" },
];

const recentActivity = [
  { action: "Schema updated", target: "Products collection", time: "2 min ago" },
  { action: "Plugin installed", target: "SEO Pro v2.1", time: "15 min ago" },
  { action: "Content published", target: "Blog: AI in 2026", time: "1 hour ago" },
  { action: "Template applied", target: "E-Commerce Layout", time: "3 hours ago" },
  { action: "User created", target: "team@example.com", time: "5 hours ago" },
];

export default function DashboardOverview() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back. Here's what's happening with your CMS.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{s.value}</div>
              <div className="flex items-center gap-1 text-xs text-primary">
                <TrendingUp className="w-3 h-3" />
                {s.change}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 hover:bg-accent/50 transition-colors gap-1">
                <div className="min-w-0">
                  <span className="text-sm text-foreground font-medium">{a.action}</span>
                  <span className="text-sm text-muted-foreground ml-2 break-all">{a.target}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
