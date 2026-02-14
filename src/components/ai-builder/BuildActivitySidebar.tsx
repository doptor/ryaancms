import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Circle, Loader2, AlertCircle, ChevronRight,
  Sparkles, Database, FileText, Code, Shield, Layers,
  Clock, Eye, Zap, ListOrdered, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BuildActivity = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "done" | "error";
  timestamp?: string;
  details?: {
    type: "understanding" | "plan" | "pages" | "database" | "security" | "summary";
    data?: any;
  };
};

export type QueuedPrompt = {
  id: string;
  text: string;
  status: "queued" | "building" | "done" | "error";
  addedAt: string;
};

interface Props {
  activities: BuildActivity[];
  queue: QueuedPrompt[];
  selectedActivityId: string | null;
  onSelectActivity: (id: string | null) => void;
  onRemoveFromQueue: (id: string) => void;
  isBuilding: boolean;
  buildElapsed: number;
}

const TYPE_ICONS: Record<string, any> = {
  understanding: Sparkles,
  plan: ListOrdered,
  pages: Layers,
  database: Database,
  security: Shield,
  summary: FileText,
};

export function BuildActivitySidebar({
  activities,
  queue,
  selectedActivityId,
  onSelectActivity,
  onRemoveFromQueue,
  isBuilding,
  buildElapsed,
}: Props) {
  const [showQueue, setShowQueue] = useState(true);

  const hasActivities = activities.length > 0;
  const hasQueue = queue.length > 0;
  const doneCount = activities.filter(a => a.status === "done").length;

  if (!hasActivities && !hasQueue) return null;

  return (
    <div className="border-t border-border bg-card">
      {/* Queue Section */}
      {hasQueue && (
        <div className="border-b border-border">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <ListOrdered className="w-3 h-3" />
              <span>Prompt Queue</span>
              <Badge variant="secondary" className="text-[9px] h-4">{queue.filter(q => q.status === "queued").length}</Badge>
            </div>
            <ChevronRight className={cn("w-3 h-3 transition-transform", showQueue && "rotate-90")} />
          </button>
          {showQueue && (
            <div className="px-3 pb-2 space-y-1">
              {queue.map((item, i) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors",
                    item.status === "building" ? "bg-primary/10 border border-primary/20" :
                    item.status === "done" ? "opacity-50" :
                    "bg-muted/50"
                  )}
                >
                  {item.status === "building" ? (
                    <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
                  ) : item.status === "done" ? (
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  ) : item.status === "error" ? (
                    <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className="truncate flex-1 text-foreground">{item.text}</span>
                  {item.status === "queued" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveFromQueue(item.id); }}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activities Section */}
      {hasActivities && (
        <div>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Build Activity</span>
              {isBuilding && buildElapsed > 0 && (
                <span className="text-[10px] text-muted-foreground">· {buildElapsed}s</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{doneCount}/{activities.length}</span>
          </div>

          <ScrollArea className="max-h-[200px]">
            <div className="px-3 pb-2 space-y-0.5">
              {activities.map((activity) => {
                const isSelected = selectedActivityId === activity.id;
                const DetailIcon = activity.details?.type ? TYPE_ICONS[activity.details.type] || Sparkles : Sparkles;

                return (
                  <button
                    key={activity.id}
                    onClick={() => onSelectActivity(isSelected ? null : activity.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-all",
                      isSelected ? "bg-primary/10 border border-primary/20" :
                      activity.status === "in_progress" ? "bg-accent/50" :
                      "hover:bg-accent/30"
                    )}
                  >
                    {activity.status === "done" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : activity.status === "in_progress" ? (
                      <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                    ) : activity.status === "error" ? (
                      <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "truncate",
                        activity.status === "done" ? "text-muted-foreground" :
                        activity.status === "in_progress" ? "text-foreground font-medium" :
                        "text-muted-foreground/60"
                      )}>
                        {activity.title}
                      </p>
                    </div>
                    {isSelected && <ChevronRight className="w-3 h-3 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// Detail viewer for when an activity is clicked
export function ActivityDetailView({ activity }: { activity: BuildActivity }) {
  if (!activity.details) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <Eye className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No additional details for this step.</p>
        </div>
      </div>
    );
  }

  const { type, data } = activity.details;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] capitalize">{type}</Badge>
            <Badge variant={activity.status === "done" ? "default" : "outline"} className="text-[10px]">
              {activity.status}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-foreground">{activity.title}</h3>
          <p className="text-xs text-muted-foreground">{activity.description}</p>
        </div>

        {/* Understanding details */}
        {type === "understanding" && data && (
          <div className="space-y-3">
            {data.scope && (
              <div className="rounded-lg border border-border p-3 space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Build Scope</p>
                <p className="text-sm font-medium text-foreground capitalize">{data.scope}</p>
                <p className="text-xs text-muted-foreground">{data.reason}</p>
              </div>
            )}
            {data.buildTarget && (
              <div className="rounded-lg border border-border p-3 space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Build Target</p>
                <p className="text-sm font-medium text-foreground">{data.buildTarget}</p>
              </div>
            )}
            {data.stepsNeeded && (
              <div className="rounded-lg border border-border p-3 space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Pipeline Steps</p>
                <p className="text-sm text-foreground">{data.stepsNeeded.length} steps required</p>
              </div>
            )}
          </div>
        )}

        {/* Plan details */}
        {type === "plan" && data?.tasks && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Execution Plan</p>
            {data.tasks.map((task: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-medium">{i + 1}</span>
                <span className="text-foreground">{task}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pages details */}
        {type === "pages" && data?.pages && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Generated Pages</p>
            {data.pages.map((page: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{page.name}</span>
                  <code className="text-[10px] text-muted-foreground bg-muted px-1 rounded">{page.route}</code>
                </div>
                <p className="text-[10px] text-muted-foreground">{page.components?.length || 0} components</p>
              </div>
            ))}
          </div>
        )}

        {/* Database details */}
        {type === "database" && data?.collections && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Database Collections</p>
            {data.collections.map((col: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-2.5 space-y-1">
                <span className="text-xs font-medium text-foreground">{col.name}</span>
                <div className="flex flex-wrap gap-1">
                  {col.fields?.map((f: any, fi: number) => (
                    <Badge key={fi} variant="outline" className="text-[9px]">{f.name}: {f.type}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Security details */}
        {type === "security" && data && (
          <div className="space-y-2">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{data.score || 0}/100</p>
              <p className="text-xs text-muted-foreground">Security Score</p>
            </div>
            {data.errors?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-destructive uppercase">Issues</p>
                {data.errors.map((e: string, i: number) => (
                  <p key={i} className="text-xs text-destructive flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" /> {e}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary details */}
        {type === "summary" && data && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {data.pages !== undefined && (
                <div className="rounded-lg border border-border p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{data.pages}</p>
                  <p className="text-[10px] text-muted-foreground">Pages</p>
                </div>
              )}
              {data.collections !== undefined && (
                <div className="rounded-lg border border-border p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{data.collections}</p>
                  <p className="text-[10px] text-muted-foreground">Collections</p>
                </div>
              )}
              {data.components !== undefined && (
                <div className="rounded-lg border border-border p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{data.components}</p>
                  <p className="text-[10px] text-muted-foreground">Components</p>
                </div>
              )}
            </div>
            {data.duration && (
              <p className="text-xs text-muted-foreground text-center">Built in {data.duration}s</p>
            )}
          </div>
        )}

        {/* Raw data fallback */}
        {!["understanding", "plan", "pages", "database", "security", "summary"].includes(type) && data && (
          <pre className="text-[10px] font-mono bg-muted rounded-lg p-3 overflow-auto text-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </ScrollArea>
  );
}
