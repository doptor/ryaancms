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
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Welcome back. Here's what's happening with your CMS.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 sm:p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm text-muted-foreground truncate">{s.label}</span>
                <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
              </div>
              <div className="text-lg sm:text-2xl font-bold text-foreground mb-0.5 sm:mb-1">{s.value}</div>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-primary">
                <TrendingUp className="w-3 h-3 shrink-0" />
                <span className="truncate">{s.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-xs sm:text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3.5 hover:bg-accent/50 transition-colors gap-0.5 sm:gap-1">
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-foreground font-medium">{a.action}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2 break-all">{a.target}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
