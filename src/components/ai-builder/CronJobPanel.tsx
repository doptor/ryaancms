import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Clock, Plus, Trash2, Play, Pause, CheckCircle2, AlertCircle, Calendar, RefreshCw, Mail, Database, Zap, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface Props {
  pipelineState: PipelineState | null;
}

type CronJob = {
  id: string;
  name: string;
  schedule: string;
  description: string;
  type: "cleanup" | "email" | "sync" | "report" | "backup" | "custom";
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
};

const CRON_TEMPLATES: { name: string; schedule: string; description: string; type: CronJob["type"] }[] = [
  { name: "Daily Database Backup", schedule: "0 2 * * *", description: "Backup all database tables at 2 AM daily", type: "backup" },
  { name: "Cleanup Expired Sessions", schedule: "0 */6 * * *", description: "Remove expired user sessions every 6 hours", type: "cleanup" },
  { name: "Send Daily Digest", schedule: "0 8 * * 1-5", description: "Send summary email to users on weekdays at 8 AM", type: "email" },
  { name: "Sync External Data", schedule: "*/30 * * * *", description: "Pull data from external APIs every 30 minutes", type: "sync" },
  { name: "Generate Weekly Report", schedule: "0 9 * * 1", description: "Generate analytics report every Monday at 9 AM", type: "report" },
  { name: "Purge Old Logs", schedule: "0 3 1 * *", description: "Delete logs older than 30 days on 1st of each month", type: "cleanup" },
  { name: "Subscription Renewal Check", schedule: "0 0 * * *", description: "Check and process subscription renewals at midnight", type: "sync" },
  { name: "Cache Warm-up", schedule: "0 6 * * *", description: "Pre-warm frequently accessed data caches at 6 AM", type: "custom" },
];

const TYPE_ICONS: Record<string, any> = {
  cleanup: Trash2,
  email: Mail,
  sync: RefreshCw,
  report: FileText,
  backup: Database,
  custom: Zap,
};

const TYPE_COLORS: Record<string, string> = {
  cleanup: "text-chart-5",
  email: "text-primary",
  sync: "text-chart-3",
  report: "text-chart-4",
  backup: "text-chart-2",
  custom: "text-chart-1",
};

export function CronJobPanel({ pipelineState }: Props) {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const [newJobSchedule, setNewJobSchedule] = useState("0 * * * *");
  const [newJobDesc, setNewJobDesc] = useState("");
  const config = pipelineState?.config;

  const addJob = (name: string, schedule: string, description: string, type: CronJob["type"]) => {
    const job: CronJob = {
      id: crypto.randomUUID(),
      name,
      schedule,
      description,
      type,
      enabled: true,
      lastRun: undefined,
      nextRun: getNextRun(schedule),
    };
    setJobs(prev => [...prev, job]);
    toast({ title: "⏰ Cron job added!", description: name });
  };

  const toggleJob = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, enabled: !j.enabled } : j));
  };

  const removeJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    toast({ title: "Cron job removed" });
  };

  const runNow = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, lastRun: new Date().toISOString() } : j));
    toast({ title: "▶️ Job triggered!", description: "Running now..." });
  };

  const getNextRun = (schedule: string): string => {
    // Simple estimation — just show a relative time
    const parts = schedule.split(" ");
    if (parts[0] === "*/30") return "In ~30 minutes";
    if (parts[0] === "0" && parts[1] === "*") return "Next hour";
    if (parts[0] === "0" && parts[1] === "*/6") return "In ~6 hours";
    if (parts[1]?.match(/^\d+$/)) return `Tomorrow at ${parts[1]}:00`;
    return "Scheduled";
  };

  const parseCronHumanReadable = (schedule: string): string => {
    const parts = schedule.split(" ");
    if (parts.length !== 5) return schedule;
    const [min, hour, dom, mon, dow] = parts;
    if (min === "*/30" && hour === "*") return "Every 30 minutes";
    if (min === "0" && hour === "*") return "Every hour";
    if (min === "0" && hour === "*/6") return "Every 6 hours";
    if (min === "0" && hour.match(/^\d+$/) && dom === "*" && mon === "*" && dow === "*") return `Daily at ${hour}:00`;
    if (min === "0" && hour.match(/^\d+$/) && dow === "1-5") return `Weekdays at ${hour}:00`;
    if (min === "0" && hour.match(/^\d+$/) && dow === "1") return `Every Monday at ${hour}:00`;
    if (dom === "1" && mon === "*") return `1st of each month at ${hour}:00`;
    return schedule;
  };

  const handleExportCrons = () => {
    const edgeFunctions = jobs.map(job => ({
      name: job.name.toLowerCase().replace(/\s+/g, "-"),
      schedule: job.schedule,
      description: job.description,
      code: `// ${job.name}\n// Schedule: ${job.schedule}\n// ${job.description}\n\nimport { serve } from "https://deno.land/std@0.168.0/http/server.ts";\n\nserve(async (req) => {\n  console.log("Running: ${job.name}");\n  // TODO: Implement ${job.type} logic\n  return new Response(JSON.stringify({ success: true, job: "${job.name}" }), {\n    headers: { "Content-Type": "application/json" },\n  });\n});\n`,
    }));
    const blob = new Blob([JSON.stringify(edgeFunctions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cron-jobs.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${jobs.length} cron jobs exported.` });
  };

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Cron Job Manager</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to configure scheduled tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Cron Job Manager</h3>
              <p className="text-[11px] text-muted-foreground">{jobs.length} scheduled task(s)</p>
            </div>
          </div>
          {jobs.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleExportCrons} className="gap-1 text-xs">
              <FileText className="w-3 h-3" /> Export
            </Button>
          )}
        </div>

        {/* Quick add */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newJobName}
              onChange={(e) => setNewJobName(e.target.value)}
              placeholder="Job name..."
              className="text-xs h-8"
            />
            <Input
              value={newJobSchedule}
              onChange={(e) => setNewJobSchedule(e.target.value)}
              placeholder="0 * * * *"
              className="text-xs h-8 w-28 font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Input
              value={newJobDesc}
              onChange={(e) => setNewJobDesc(e.target.value)}
              placeholder="Description..."
              className="text-xs h-8 flex-1"
            />
            <Button
              size="sm"
              onClick={() => {
                if (!newJobName.trim()) return;
                addJob(newJobName, newJobSchedule, newJobDesc, "custom");
                setNewJobName("");
                setNewJobDesc("");
              }}
              disabled={!newJobName.trim()}
              className="gap-1 text-xs h-8"
            >
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full gap-1 text-xs"
        >
          <Calendar className="w-3 h-3" /> {showTemplates ? "Hide Templates" : "Show Templates"}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Templates */}
          {showTemplates && (
            <div className="space-y-2 pb-3 border-b border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Quick Add Templates</p>
              <div className="grid grid-cols-1 gap-1.5">
                {CRON_TEMPLATES.map((t) => {
                  const Icon = TYPE_ICONS[t.type] || Zap;
                  const alreadyAdded = jobs.some(j => j.name === t.name);
                  return (
                    <button
                      key={t.name}
                      onClick={() => { addJob(t.name, t.schedule, t.description, t.type); }}
                      disabled={alreadyAdded}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors text-xs",
                        alreadyAdded ? "border-primary/20 bg-primary/5 opacity-60" : "border-border hover:border-primary/30 hover:bg-accent"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", TYPE_COLORS[t.type])} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground">{t.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <code className="font-mono">{t.schedule}</code>
                          <span>·</span>
                          <span>{t.description}</span>
                        </div>
                      </div>
                      {alreadyAdded && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active jobs */}
          {jobs.length === 0 && !showTemplates ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No cron jobs configured yet. Add one above or use a template.
            </div>
          ) : (
            jobs.map((job) => {
              const Icon = TYPE_ICONS[job.type] || Zap;
              return (
                <div key={job.id} className={cn(
                  "rounded-xl border p-3 space-y-2 transition-colors",
                  job.enabled ? "border-border" : "border-border/50 opacity-60"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", TYPE_COLORS[job.type])} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground">{job.name}</span>
                          <Badge variant={job.enabled ? "secondary" : "outline"} className="text-[9px] h-4">
                            {job.enabled ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{job.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{job.schedule}</code>
                    <span>{parseCronHumanReadable(job.schedule)}</span>
                  </div>

                  {job.lastRun && (
                    <p className="text-[10px] text-muted-foreground">Last run: {new Date(job.lastRun).toLocaleString()}</p>
                  )}

                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => runNow(job.id)} className="gap-1 text-xs h-7">
                      <Play className="w-3 h-3" /> Run Now
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleJob(job.id)} className="gap-1 text-xs h-7">
                      {job.enabled ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Resume</>}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeJob(job.id)} className="gap-1 text-xs h-7 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" /> Remove
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
