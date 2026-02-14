import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3, TrendingUp, Users, Eye, Clock, Globe, ArrowUp, ArrowDown,
  Minus, Calendar, Zap, FileText, Database, Smartphone, Monitor,
} from "lucide-react";
import type { PipelineState } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface Props {
  pipelineState: PipelineState | null;
}

type TimeRange = "24h" | "7d" | "30d" | "90d";

type MetricCard = {
  label: string;
  value: string;
  change: number;
  icon: any;
  color: string;
};

type TrafficSource = { name: string; visits: number; percentage: number };
type PageView = { page: string; views: number; avgTime: string; bounceRate: number };
type DeviceBreakdown = { device: string; icon: any; percentage: number };
type HourlyData = { hour: string; visitors: number };

function generateMockData(range: TimeRange, config: any) {
  const multiplier = range === "24h" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const baseVisitors = 120 * multiplier;
  const pages = (config?.pages || []).map((p: any) => p.name || "Page");

  const metrics: MetricCard[] = [
    { label: "Total Visitors", value: baseVisitors.toLocaleString(), change: 12.5, icon: Users, color: "text-primary" },
    { label: "Page Views", value: (baseVisitors * 3.2).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","), change: 8.3, icon: Eye, color: "text-chart-3" },
    { label: "Avg. Session", value: `${(2 + Math.random() * 3).toFixed(1)}m`, change: -2.1, icon: Clock, color: "text-chart-4" },
    { label: "Bounce Rate", value: `${(35 + Math.random() * 15).toFixed(1)}%`, change: -5.4, icon: Zap, color: "text-chart-5" },
  ];

  const sources: TrafficSource[] = [
    { name: "Direct", visits: Math.floor(baseVisitors * 0.35), percentage: 35 },
    { name: "Google Search", visits: Math.floor(baseVisitors * 0.28), percentage: 28 },
    { name: "Social Media", visits: Math.floor(baseVisitors * 0.18), percentage: 18 },
    { name: "Referral", visits: Math.floor(baseVisitors * 0.12), percentage: 12 },
    { name: "Email", visits: Math.floor(baseVisitors * 0.07), percentage: 7 },
  ];

  const pageViews: PageView[] = pages.length > 0
    ? pages.map((name: string, i: number) => ({
        page: name,
        views: Math.floor(baseVisitors * (1 - i * 0.15) * (0.8 + Math.random() * 0.4)),
        avgTime: `${(1 + Math.random() * 4).toFixed(1)}m`,
        bounceRate: Math.floor(25 + Math.random() * 30),
      }))
    : [{ page: "Home", views: baseVisitors, avgTime: "2.4m", bounceRate: 38 }];

  const devices: DeviceBreakdown[] = [
    { device: "Desktop", icon: Monitor, percentage: 52 },
    { device: "Mobile", icon: Smartphone, percentage: 38 },
    { device: "Tablet", icon: Monitor, percentage: 10 },
  ];

  const hourly: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    visitors: Math.floor(5 + Math.sin((i - 6) * 0.3) * 20 + Math.random() * 15),
  }));

  return { metrics, sources, pageViews, devices, hourly };
}

function MiniBarChart({ data, maxValue }: { data: number[]; maxValue: number }) {
  return (
    <div className="flex items-end gap-px h-12">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-colors min-w-[2px]"
          style={{ height: `${Math.max((v / maxValue) * 100, 4)}%` }}
          title={`${v} visitors`}
        />
      ))}
    </div>
  );
}

export function AdvancedAnalyticsPanel({ pipelineState }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const config = pipelineState?.config;

  const data = useMemo(() => generateMockData(timeRange, config), [timeRange, config]);
  const maxHourly = Math.max(...data.hourly.map(h => h.visitors));

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Advanced Analytics</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Analytics</h3>
              <p className="text-[11px] text-muted-foreground">{config.title} — {timeRange} overview</p>
            </div>
          </div>
          <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
            {(["24h", "7d", "30d", "90d"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                  timeRange === range ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-2">
            {data.metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <m.icon className={cn("w-4 h-4", m.color)} />
                  <div className={cn(
                    "flex items-center gap-0.5 text-[10px] font-medium",
                    m.change > 0 ? "text-chart-3" : m.change < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {m.change > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : m.change < 0 ? <ArrowDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                    {Math.abs(m.change)}%
                  </div>
                </div>
                <p className="text-lg font-bold text-foreground">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Hourly Traffic Chart */}
          <div className="rounded-xl border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Traffic Overview</p>
              <Badge variant="outline" className="text-[9px]">Hourly</Badge>
            </div>
            <MiniBarChart data={data.hourly.map(h => h.visitors)} maxValue={maxHourly} />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="rounded-xl border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">Traffic Sources</p>
            {data.sources.map((s) => (
              <div key={s.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{s.name}</span>
                  <span className="text-muted-foreground">{s.visits.toLocaleString()} ({s.percentage}%)</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${s.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Page Views Table */}
          <div className="rounded-xl border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">Top Pages</p>
            <div className="space-y-1">
              <div className="grid grid-cols-4 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide pb-1 border-b border-border">
                <span>Page</span>
                <span className="text-right">Views</span>
                <span className="text-right">Avg Time</span>
                <span className="text-right">Bounce</span>
              </div>
              {data.pageViews.sort((a, b) => b.views - a.views).map((pv) => (
                <div key={pv.page} className="grid grid-cols-4 text-xs py-1">
                  <span className="text-foreground truncate">{pv.page}</span>
                  <span className="text-right text-muted-foreground">{pv.views.toLocaleString()}</span>
                  <span className="text-right text-muted-foreground">{pv.avgTime}</span>
                  <span className={cn("text-right", pv.bounceRate > 50 ? "text-destructive" : "text-muted-foreground")}>{pv.bounceRate}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="rounded-xl border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">Device Breakdown</p>
            <div className="flex gap-3">
              {data.devices.map((d) => (
                <div key={d.device} className="flex-1 text-center space-y-1">
                  <d.icon className="w-5 h-5 mx-auto text-muted-foreground" />
                  <p className="text-lg font-bold text-foreground">{d.percentage}%</p>
                  <p className="text-[10px] text-muted-foreground">{d.device}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
