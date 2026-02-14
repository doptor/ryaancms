import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users, MousePointer2, MessageSquare, Bell,
  Circle, Send, Eye, Edit3, Clock, Zap,
  CheckCircle2, AlertCircle, UserPlus, Wifi, WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { PipelineState } from "@/lib/engine/orchestrator";

interface CollaborationPanelProps {
  pipelineState: PipelineState | null;
  isBuilding: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  status: "online" | "away" | "building" | "viewing";
  cursor?: { x: number; y: number; tab: string };
  lastActive: number;
}

interface ActivityEvent {
  id: string;
  user: string;
  action: string;
  detail: string;
  timestamp: number;
  type: "build" | "edit" | "deploy" | "review" | "chat" | "join";
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

const CURSOR_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const MOCK_MEMBERS: TeamMember[] = [
  { id: "1", name: "You", color: CURSOR_COLORS[0], status: "online", lastActive: Date.now() },
];

export function CollaborationPanel({ pipelineState, isBuilding }: CollaborationPanelProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<"presence" | "activity" | "chat">("presence");
  const [members, setMembers] = useState<TeamMember[]>(MOCK_MEMBERS);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Simulate presence with current user
  useEffect(() => {
    if (user) {
      setMembers([{
        id: user.id,
        name: user.email?.split("@")[0] || "You",
        color: CURSOR_COLORS[0],
        status: isBuilding ? "building" : "online",
        lastActive: Date.now(),
      }]);
    }
  }, [user, isBuilding]);

  // Track build activity
  useEffect(() => {
    if (isBuilding) {
      addActivity("build", "Started building", pipelineState?.config?.title || "project");
    } else if (pipelineState?.stage === "complete") {
      addActivity("build", "Build completed", `${pipelineState?.config?.title} — ${pipelineState?.config?.pages?.length || 0} pages`);
    }
  }, [isBuilding, pipelineState?.stage]);

  const addActivity = (type: ActivityEvent["type"], action: string, detail: string) => {
    setActivities(prev => [{
      id: crypto.randomUUID(),
      user: user?.email?.split("@")[0] || "You",
      action,
      detail,
      timestamp: Date.now(),
      type,
    }, ...prev].slice(0, 50));
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      user: user?.email?.split("@")[0] || "You",
      text: chatInput,
      timestamp: Date.now(),
    }]);
    setChatInput("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const getStatusIcon = (status: TeamMember["status"]) => {
    switch (status) {
      case "online": return <Circle className="w-2.5 h-2.5 fill-primary text-primary" />;
      case "building": return <Zap className="w-2.5 h-2.5 text-chart-5 animate-pulse" />;
      case "viewing": return <Eye className="w-2.5 h-2.5 text-chart-2" />;
      case "away": return <Circle className="w-2.5 h-2.5 text-muted-foreground" />;
    }
  };

  const getActivityIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "build": return <Zap className="w-3.5 h-3.5 text-chart-5" />;
      case "edit": return <Edit3 className="w-3.5 h-3.5 text-chart-2" />;
      case "deploy": return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
      case "review": return <Eye className="w-3.5 h-3.5 text-chart-3" />;
      case "chat": return <MessageSquare className="w-3.5 h-3.5 text-chart-4" />;
      case "join": return <UserPlus className="w-3.5 h-3.5 text-chart-1" />;
    }
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const sections = [
    { key: "presence", label: "Team", icon: Users, count: members.length },
    { key: "activity", label: "Activity", icon: Bell, count: activities.length },
    { key: "chat", label: "Chat", icon: MessageSquare, count: chatMessages.length },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Collaboration</span>
          <Badge variant="secondary" className="text-[10px] gap-1">
            {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            {isConnected ? "Live" : "Offline"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {members.map(m => (
            <div
              key={m.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2"
              style={{ backgroundColor: m.color + "20", borderColor: m.color, color: m.color }}
              title={m.name}
            >
              {m.name[0].toUpperCase()}
            </div>
          ))}
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Invite member">
            <UserPlus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-border bg-card/50 shrink-0">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2",
              activeSection === s.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
            {s.count > 0 && (
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{s.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeSection === "presence" && (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Online members */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Online — {members.filter(m => m.status !== "away").length}</h3>
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: m.color + "20", color: m.color }}
                    >
                      {m.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{m.name}</span>
                        {getStatusIcon(m.status)}
                      </div>
                      <span className="text-[11px] text-muted-foreground capitalize">{m.status}</span>
                    </div>
                    {m.cursor && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MousePointer2 className="w-3 h-3" style={{ color: m.color }} />
                        {m.cursor.tab}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Cursors visualization */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Cursors</h3>
                <div className="rounded-xl border border-border bg-muted/30 p-4 relative min-h-[120px]">
                  {members.filter(m => m.status !== "away").map((m, i) => (
                    <div
                      key={m.id}
                      className="absolute flex items-center gap-1 animate-pulse"
                      style={{
                        left: `${20 + i * 30}%`,
                        top: `${30 + i * 20}%`,
                      }}
                    >
                      <MousePointer2 className="w-4 h-4" style={{ color: m.color }} />
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: m.color + "20", color: m.color }}
                      >
                        {m.name}
                      </span>
                    </div>
                  ))}
                  {members.length === 1 && (
                    <p className="text-xs text-muted-foreground text-center pt-8">
                      Invite team members to see live cursors
                    </p>
                  )}
                </div>
              </div>

              {/* Build sync status */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Build Sync</h3>
                <div className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">Current Build</span>
                    <Badge variant={isBuilding ? "default" : "secondary"} className="text-[10px]">
                      {isBuilding ? "In Progress" : pipelineState?.stage === "complete" ? "Complete" : "Idle"}
                    </Badge>
                  </div>
                  {pipelineState?.config && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Project</span>
                      <span className="text-xs text-foreground font-medium">{pipelineState.config.title}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Viewers</span>
                    <span className="text-xs text-foreground">{members.filter(m => m.status === "viewing").length}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        {activeSection === "activity" && (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {activities.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground">Build something to see activity here</p>
                </div>
              ) : (
                activities.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      {getActivityIcon(a.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">{a.user}</span>
                        <span className="text-xs text-muted-foreground">{a.action}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{a.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(a.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {activeSection === "chat" && (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Team chat</p>
                    <p className="text-xs text-muted-foreground">Discuss build decisions with your team</p>
                  </div>
                )}
                {chatMessages.map(msg => (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {msg.user[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{msg.user}</span>
                        <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendChat()}
                  placeholder="Type a message..."
                  className="text-sm h-9"
                />
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSendChat} disabled={!chatInput.trim()}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
