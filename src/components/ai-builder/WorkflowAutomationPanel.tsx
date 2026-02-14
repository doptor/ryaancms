import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { GitBranch, Plus, Trash2, Play, CheckCircle2, ArrowRight, Zap, Mail, Database, Clock, Webhook, Bell, FileText, Filter, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface Props {
  pipelineState: PipelineState | null;
}

type TriggerType = "webhook" | "schedule" | "database" | "manual" | "event";
type ActionType = "email" | "database" | "api_call" | "notification" | "transform" | "condition";

type WorkflowStep = {
  id: string;
  type: "trigger" | "action";
  triggerType?: TriggerType;
  actionType?: ActionType;
  name: string;
  config: Record<string, string>;
};

type Workflow = {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  enabled: boolean;
  runs: number;
  lastRun?: string;
};

const TRIGGER_OPTIONS: { type: TriggerType; name: string; icon: any; description: string }[] = [
  { type: "webhook", name: "Webhook", icon: Webhook, description: "Triggered by incoming HTTP request" },
  { type: "schedule", name: "Schedule", icon: Clock, description: "Runs on a cron schedule" },
  { type: "database", name: "DB Change", icon: Database, description: "Triggered on insert/update/delete" },
  { type: "manual", name: "Manual", icon: Play, description: "Triggered manually by user" },
  { type: "event", name: "App Event", icon: Zap, description: "Triggered by in-app events" },
];

const ACTION_OPTIONS: { type: ActionType; name: string; icon: any; description: string }[] = [
  { type: "email", name: "Send Email", icon: Mail, description: "Send an email notification" },
  { type: "database", name: "DB Operation", icon: Database, description: "Insert, update, or delete records" },
  { type: "api_call", name: "API Call", icon: Webhook, description: "Make an HTTP request to external API" },
  { type: "notification", name: "Notification", icon: Bell, description: "Send push/in-app notification" },
  { type: "transform", name: "Transform Data", icon: Filter, description: "Map, filter, or transform data" },
  { type: "condition", name: "Condition", icon: GitBranch, description: "If/else branching logic" },
];

const TEMPLATES: { name: string; description: string; steps: WorkflowStep[] }[] = [
  {
    name: "Welcome Email on Signup",
    description: "Send welcome email when a new user registers",
    steps: [
      { id: "t1", type: "trigger", triggerType: "database", name: "New User Created", config: { table: "users", event: "INSERT" } },
      { id: "a1", type: "action", actionType: "email", name: "Send Welcome Email", config: { template: "welcome", to: "{{user.email}}" } },
    ],
  },
  {
    name: "Order Notification",
    description: "Notify admin and customer when order is placed",
    steps: [
      { id: "t1", type: "trigger", triggerType: "database", name: "New Order", config: { table: "orders", event: "INSERT" } },
      { id: "a1", type: "action", actionType: "email", name: "Email Customer", config: { template: "order_confirmation", to: "{{order.email}}" } },
      { id: "a2", type: "action", actionType: "notification", name: "Notify Admin", config: { channel: "admin", message: "New order #{{order.id}}" } },
    ],
  },
  {
    name: "Daily Report",
    description: "Generate and send daily analytics report",
    steps: [
      { id: "t1", type: "trigger", triggerType: "schedule", name: "Daily at 9 AM", config: { schedule: "0 9 * * *" } },
      { id: "a1", type: "action", actionType: "database", name: "Query Analytics", config: { query: "SELECT * FROM analytics WHERE date = today()" } },
      { id: "a2", type: "action", actionType: "transform", name: "Format Report", config: { format: "html_table" } },
      { id: "a3", type: "action", actionType: "email", name: "Send Report", config: { to: "team@company.com", subject: "Daily Report" } },
    ],
  },
  {
    name: "Webhook to Database",
    description: "Receive webhook data and store in database",
    steps: [
      { id: "t1", type: "trigger", triggerType: "webhook", name: "Incoming Webhook", config: { path: "/webhook/data", method: "POST" } },
      { id: "a1", type: "action", actionType: "transform", name: "Validate & Transform", config: { schema: "auto" } },
      { id: "a2", type: "action", actionType: "database", name: "Store Data", config: { table: "webhook_data", operation: "INSERT" } },
    ],
  },
];

export function WorkflowAutomationPanel({ pipelineState }: Props) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const config = pipelineState?.config;

  const createFromTemplate = (template: typeof TEMPLATES[0]) => {
    const wf: Workflow = {
      id: crypto.randomUUID(),
      name: template.name,
      description: template.description,
      steps: template.steps.map(s => ({ ...s, id: crypto.randomUUID() })),
      enabled: true,
      runs: 0,
    };
    setWorkflows(prev => [...prev, wf]);
    toast({ title: `⚡ Workflow "${template.name}" created!` });
  };

  const createBlank = () => {
    if (!newName.trim()) return;
    const wf: Workflow = {
      id: crypto.randomUUID(),
      name: newName,
      description: "",
      steps: [],
      enabled: true,
      runs: 0,
    };
    setWorkflows(prev => [...prev, wf]);
    setNewName("");
    setShowCreate(false);
    setEditingId(wf.id);
    toast({ title: `⚡ Workflow "${newName}" created!` });
  };

  const toggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const removeWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    toast({ title: "Workflow removed" });
  };

  const runWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, runs: w.runs + 1, lastRun: new Date().toISOString() } : w));
    toast({ title: "▶️ Workflow executed!", description: "All steps completed successfully." });
  };

  const addStepToWorkflow = (wfId: string, stepType: "trigger" | "action", subType: string, name: string) => {
    const step: WorkflowStep = {
      id: crypto.randomUUID(),
      type: stepType,
      ...(stepType === "trigger" ? { triggerType: subType as TriggerType } : { actionType: subType as ActionType }),
      name,
      config: {},
    };
    setWorkflows(prev => prev.map(w => w.id === wfId ? { ...w, steps: [...w.steps, step] } : w));
  };

  const removeStep = (wfId: string, stepId: string) => {
    setWorkflows(prev => prev.map(w => w.id === wfId ? { ...w, steps: w.steps.filter(s => s.id !== stepId) } : w));
  };

  const getStepIcon = (step: WorkflowStep) => {
    if (step.type === "trigger") {
      return TRIGGER_OPTIONS.find(t => t.type === step.triggerType)?.icon || Zap;
    }
    return ACTION_OPTIONS.find(a => a.type === step.actionType)?.icon || Settings;
  };

  const exportWorkflows = () => {
    const blob = new Blob([JSON.stringify(workflows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflows.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${workflows.length} workflows exported.` });
  };

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <GitBranch className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Workflow Automation</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to create automated workflows.</p>
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
              <GitBranch className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Workflow Automation</h3>
              <p className="text-[11px] text-muted-foreground">{workflows.length} workflow(s) · {workflows.filter(w => w.enabled).length} active</p>
            </div>
          </div>
          {workflows.length > 0 && (
            <Button size="sm" variant="outline" onClick={exportWorkflows} className="gap-1 text-xs">
              <FileText className="w-3 h-3" /> Export
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {showCreate ? (
            <div className="flex gap-2 flex-1">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Workflow name..." className="text-xs h-8" onKeyDown={(e) => e.key === "Enter" && createBlank()} />
              <Button size="sm" onClick={createBlank} disabled={!newName.trim()} className="gap-1 text-xs h-8">
                <Plus className="w-3 h-3" /> Create
              </Button>
            </div>
          ) : (
            <>
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1 text-xs flex-1">
                <Plus className="w-3 h-3" /> New Workflow
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowTemplates(!showTemplates)} className="gap-1 text-xs">
                <Zap className="w-3 h-3" /> Templates
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Templates */}
          {showTemplates && (
            <div className="space-y-2 pb-3 border-b border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Workflow Templates</p>
              {TEMPLATES.map((t) => {
                const alreadyAdded = workflows.some(w => w.name === t.name);
                return (
                  <button
                    key={t.name}
                    onClick={() => createFromTemplate(t)}
                    disabled={alreadyAdded}
                    className={cn(
                      "w-full flex items-start gap-2.5 p-3 rounded-lg border text-left transition-colors text-xs",
                      alreadyAdded ? "border-primary/20 bg-primary/5 opacity-60" : "border-border hover:border-primary/30 hover:bg-accent"
                    )}
                  >
                    <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground">{t.description}</div>
                      <div className="flex items-center gap-1 mt-1.5">
                        {t.steps.map((s, i) => (
                          <span key={i} className="flex items-center gap-0.5">
                            <Badge variant="outline" className="text-[8px] h-3.5">{s.name}</Badge>
                            {i < t.steps.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />}
                          </span>
                        ))}
                      </div>
                    </div>
                    {alreadyAdded && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Workflows */}
          {workflows.length === 0 && !showTemplates ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No workflows yet. Create one or use a template.
            </div>
          ) : (
            workflows.map((wf) => {
              const isEditing = editingId === wf.id;
              return (
                <div key={wf.id} className={cn(
                  "rounded-xl border p-3 space-y-2.5 transition-colors",
                  wf.enabled ? "border-border" : "border-border/50 opacity-60"
                )}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">{wf.name}</span>
                        <Badge variant={wf.enabled ? "secondary" : "outline"} className="text-[9px] h-4">
                          {wf.enabled ? "Active" : "Paused"}
                        </Badge>
                        {wf.runs > 0 && (
                          <Badge variant="outline" className="text-[9px] h-4">{wf.runs} runs</Badge>
                        )}
                      </div>
                      {wf.description && <p className="text-[11px] text-muted-foreground">{wf.description}</p>}
                    </div>
                  </div>

                  {/* Step visualization */}
                  {wf.steps.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {wf.steps.map((step, i) => {
                        const Icon = getStepIcon(step);
                        return (
                          <span key={step.id} className="flex items-center gap-1">
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-md border text-[10px]",
                              step.type === "trigger" ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-foreground"
                            )}>
                              <Icon className="w-3 h-3" />
                              {step.name}
                              {isEditing && (
                                <button onClick={() => removeStep(wf.id, step.id)} className="ml-0.5 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                            {i < wf.steps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Add steps when editing */}
                  {isEditing && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Add Step</p>
                      <div className="flex flex-wrap gap-1">
                        {(wf.steps.filter(s => s.type === "trigger").length === 0 ? TRIGGER_OPTIONS : []).map((t) => (
                          <button
                            key={t.type}
                            onClick={() => addStepToWorkflow(wf.id, "trigger", t.type, t.name)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md border border-primary/20 bg-primary/5 text-primary text-[10px] hover:bg-primary/10"
                          >
                            <t.icon className="w-3 h-3" /> {t.name}
                          </button>
                        ))}
                        {ACTION_OPTIONS.map((a) => (
                          <button
                            key={a.type}
                            onClick={() => addStepToWorkflow(wf.id, "action", a.type, a.name)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-muted text-foreground text-[10px] hover:bg-accent"
                          >
                            <a.icon className="w-3 h-3" /> {a.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => runWorkflow(wf.id)} className="gap-1 text-xs h-7">
                      <Play className="w-3 h-3" /> Run
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(isEditing ? null : wf.id)} className="gap-1 text-xs h-7">
                      <Settings className="w-3 h-3" /> {isEditing ? "Done" : "Edit"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleWorkflow(wf.id)} className="gap-1 text-xs h-7">
                      {wf.enabled ? "Pause" : "Resume"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeWorkflow(wf.id)} className="gap-1 text-xs h-7 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
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
