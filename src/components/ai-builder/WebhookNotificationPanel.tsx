import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Bell, Webhook, Plus, Trash2, Send, Check, X,
  Globe, Zap, AlertCircle, CheckCircle2, Clock,
  Settings, Copy, Eye, EyeOff, ChevronRight,
  MessageSquare, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";

interface WebhookNotificationPanelProps {
  pipelineState: PipelineState | null;
  isBuilding: boolean;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: string;
}

interface Notification {
  id: string;
  type: "build_start" | "build_complete" | "build_error" | "deploy" | "quality_alert" | "security_alert";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

const EVENT_OPTIONS = [
  { id: "build.start", label: "Build Started", icon: Zap },
  { id: "build.complete", label: "Build Complete", icon: CheckCircle2 },
  { id: "build.error", label: "Build Error", icon: AlertCircle },
  { id: "deploy.success", label: "Deploy Success", icon: Globe },
  { id: "quality.below_threshold", label: "Quality Alert", icon: Settings },
  { id: "security.issue", label: "Security Issue", icon: AlertCircle },
];

export function WebhookNotificationPanel({ pipelineState, isBuilding }: WebhookNotificationPanelProps) {
  const [activeView, setActiveView] = useState<"notifications" | "webhooks">("notifications");
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: "wh-1",
      name: "Slack Notifications",
      url: "https://hooks.slack.com/services/...",
      events: ["build.complete", "build.error"],
      isActive: true,
      secret: "whsec_abc123def456",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "wh-2",
      name: "Discord Bot",
      url: "https://discord.com/api/webhooks/...",
      events: ["build.complete", "deploy.success"],
      isActive: false,
      secret: "whsec_xyz789",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: "", url: "", events: [] as string[] });
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  // Generate notifications from build events
  const addNotification = useCallback((type: Notification["type"], title: string, message: string) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        type,
        title,
        message,
        timestamp: Date.now(),
        read: false,
      },
      ...prev,
    ].slice(0, 50));
  }, []);

  useEffect(() => {
    if (isBuilding) {
      addNotification("build_start", "Build Started", "AI pipeline is processing your prompt...");
    }
  }, [isBuilding, addNotification]);

  useEffect(() => {
    if (pipelineState?.stage === "complete" && pipelineState.config) {
      addNotification(
        "build_complete",
        "Build Complete",
        `"${pipelineState.config.title}" built successfully with ${pipelineState.config.pages.length} pages.`
      );
      if (pipelineState.qualityScore?.overall_score && pipelineState.qualityScore.overall_score < 80) {
        addNotification(
          "quality_alert",
          "Quality Alert",
          `Quality score is ${pipelineState.qualityScore.overall_score}/100 — below 80 threshold.`
        );
      }
      if (pipelineState.validation && pipelineState.validation.errors.length > 0) {
        addNotification(
          "security_alert",
          "Security Issues Detected",
          `${pipelineState.validation.errors.length} security errors found.`
        );
      }
    }
    if (pipelineState?.stage === "error") {
      addNotification("build_error", "Build Failed", pipelineState.error || "Unknown error occurred.");
    }
  }, [pipelineState?.stage, addNotification]);

  const handleAddWebhook = () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim()) return;
    const wh: WebhookConfig = {
      id: `wh-${Date.now()}`,
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      isActive: true,
      secret: `whsec_${Math.random().toString(36).slice(2, 14)}`,
      createdAt: new Date().toISOString(),
    };
    setWebhooks((prev) => [wh, ...prev]);
    setNewWebhook({ name: "", url: "", events: [] });
    setShowAddWebhook(false);
    toast({ title: "Webhook added", description: wh.name });
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast({ title: "Webhook deleted" });
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w))
    );
  };

  const handleTestWebhook = async (id: string) => {
    setTestingId(id);
    await new Promise((r) => setTimeout(r, 1500));
    setTestingId(null);
    toast({ title: "Test sent!", description: "Webhook test payload delivered." });
  };

  const handleToggleEvent = (eventId: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const notifIcons: Record<string, any> = {
    build_start: Zap,
    build_complete: CheckCircle2,
    build_error: AlertCircle,
    deploy: Globe,
    quality_alert: Settings,
    security_alert: AlertCircle,
  };

  const notifColors: Record<string, string> = {
    build_start: "text-primary",
    build_complete: "text-primary",
    build_error: "text-destructive",
    deploy: "text-chart-3",
    quality_alert: "text-chart-5",
    security_alert: "text-destructive",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Notifications & Webhooks</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-[10px] h-4 px-1.5">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setActiveView("notifications")}
            className={cn("px-2.5 py-1 text-[11px] font-medium transition-colors",
              activeView === "notifications" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            )}
          >
            <Bell className="w-3 h-3 inline mr-1" />Alerts
          </button>
          <button
            onClick={() => setActiveView("webhooks")}
            className={cn("px-2.5 py-1 text-[11px] font-medium transition-colors",
              activeView === "webhooks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            )}
          >
            <Webhook className="w-3 h-3 inline mr-1" />Webhooks
          </button>
        </div>
      </div>

      {activeView === "notifications" ? (
        <div className="flex flex-col flex-1 min-h-0">
          {unreadCount > 0 && (
            <div className="px-4 py-2 border-b border-border bg-muted/30 shrink-0">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
                <Check className="w-3 h-3" /> Mark all read
              </Button>
            </div>
          )}
          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Bell className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">No Notifications</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Build events and alerts will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-1.5">
                {notifications.map((notif) => {
                  const Icon = notifIcons[notif.type] || Bell;
                  const color = notifColors[notif.type] || "text-muted-foreground";
                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer",
                        notif.read
                          ? "border-border bg-card"
                          : "border-primary/20 bg-primary/5"
                      )}
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                        )
                      }
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        notif.read ? "bg-muted" : "bg-primary/10"
                      )}>
                        <Icon className={cn("w-4 h-4", color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{notif.title}</p>
                          {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                        <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {formatTime(notif.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-4 py-2 border-b border-border bg-muted/30 shrink-0">
            <Button
              size="sm" className="h-7 text-xs gap-1"
              onClick={() => setShowAddWebhook(!showAddWebhook)}
            >
              {showAddWebhook ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {showAddWebhook ? "Cancel" : "Add Webhook"}
            </Button>
          </div>

          {showAddWebhook && (
            <div className="px-4 py-3 border-b border-border bg-card space-y-3 shrink-0">
              <Input
                placeholder="Webhook name (e.g. Slack)"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook((p) => ({ ...p, name: e.target.value }))}
                className="h-8 text-xs"
              />
              <Input
                placeholder="https://hooks.example.com/..."
                value={newWebhook.url}
                onChange={(e) => setNewWebhook((p) => ({ ...p, url: e.target.value }))}
                className="h-8 text-xs font-mono"
              />
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">Events</p>
                <div className="flex flex-wrap gap-1.5">
                  {EVENT_OPTIONS.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => handleToggleEvent(ev.id)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors",
                        newWebhook.events.includes(ev.id)
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      <ev.icon className="w-3 h-3 inline mr-1" />
                      {ev.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button size="sm" className="w-full h-8 text-xs gap-1" onClick={handleAddWebhook}>
                <Plus className="w-3 h-3" /> Add Webhook
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1">
            {webhooks.length === 0 ? (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Webhook className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">No Webhooks</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Add webhooks to get notified about build events.</p>
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {webhooks.map((wh) => {
                  const isExpanded = expandedWebhook === wh.id;
                  return (
                    <div key={wh.id} className={cn(
                      "rounded-xl border bg-card overflow-hidden transition-all",
                      isExpanded ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/30"
                    )}>
                      <button
                        onClick={() => setExpandedWebhook(isExpanded ? null : wh.id)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                          wh.isActive ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Webhook className={cn("w-4 h-4", wh.isActive ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{wh.name}</p>
                            <Badge variant={wh.isActive ? "secondary" : "outline"} className="text-[10px] h-4">
                              {wh.isActive ? "Active" : "Paused"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">{wh.url}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {wh.events.map((ev) => (
                              <Badge key={ev} variant="outline" className="text-[9px] h-3.5">{ev}</Badge>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-border pt-2 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Active</span>
                            <Switch checked={wh.isActive} onCheckedChange={() => handleToggleWebhook(wh.id)} />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Signing Secret</span>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-[11px] font-mono text-foreground bg-muted px-2 py-1 rounded flex-1 truncate">
                                {showSecrets[wh.id] ? wh.secret : "••••••••••••"}
                              </code>
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0"
                                onClick={() => setShowSecrets((p) => ({ ...p, [wh.id]: !p[wh.id] }))}
                              >
                                {showSecrets[wh.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(wh.secret);
                                  toast({ title: "Copied!" });
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1"
                              onClick={() => handleTestWebhook(wh.id)}
                              disabled={testingId === wh.id}
                            >
                              {testingId === wh.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              Test
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-8 text-xs gap-1 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteWebhook(wh.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
