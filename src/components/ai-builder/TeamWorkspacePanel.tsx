import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Users, Plus, Crown, Shield, User, Mail, Trash2, CheckCircle2, Copy, Check, Settings, Eye, Edit3, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface Props {
  pipelineState: PipelineState | null;
}

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "pending";
  avatar?: string;
  lastActive?: string;
};

type ActivityItem = {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
};

const ROLE_CONFIG: Record<string, { icon: any; label: string; color: string; permissions: string[] }> = {
  owner: { icon: Crown, label: "Owner", color: "text-chart-4", permissions: ["Full access", "Manage team", "Billing", "Delete project"] },
  admin: { icon: Shield, label: "Admin", color: "text-primary", permissions: ["Edit code", "Manage team", "Deploy", "Settings"] },
  editor: { icon: Edit3, label: "Editor", color: "text-chart-3", permissions: ["Edit code", "Preview", "Comment"] },
  viewer: { icon: Eye, label: "Viewer", color: "text-muted-foreground", permissions: ["View code", "Preview", "Comment"] },
};

export function TeamWorkspacePanel({ pipelineState }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: "1", name: "You", email: "you@example.com", role: "owner", status: "active", lastActive: "Now" },
  ]);
  const [activity] = useState<ActivityItem[]>([
    { id: "a1", user: "You", action: "created", target: "project", time: "Just now" },
    { id: "a2", user: "You", action: "built", target: "initial version", time: "2 min ago" },
  ]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [copied, setCopied] = useState(false);
  const config = pipelineState?.config;

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "pending",
    };
    setMembers(prev => [...prev, newMember]);
    setInviteEmail("");
    toast({ title: "📧 Invitation sent!", description: `Invited ${inviteEmail} as ${inviteRole}` });
  };

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    toast({ title: "Member removed" });
  };

  const changeRole = (id: string, role: TeamMember["role"]) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`https://ryaancms.lovable.app/invite/${config?.title?.toLowerCase().replace(/\s+/g, "-") || "project"}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Team Workspace</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to invite team members.</p>
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
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Team Workspace</h3>
              <p className="text-[11px] text-muted-foreground">{members.length} member(s) · {members.filter(m => m.status === "pending").length} pending</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={copyInviteLink} className="gap-1 text-xs">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Invite Link"}
          </Button>
        </div>

        {/* Invite form */}
        <div className="flex gap-2">
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            className="text-xs h-8 flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as any)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button size="sm" onClick={handleInvite} className="gap-1 text-xs h-8">
            <Plus className="w-3 h-3" /> Invite
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Members */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Team Members</p>
            {members.map((member) => {
              const roleConfig = ROLE_CONFIG[member.role];
              const RoleIcon = roleConfig.icon;
              return (
                <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">{member.name}</span>
                      {member.status === "pending" && (
                        <Badge variant="outline" className="text-[9px] h-4">Pending</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" className={cn("text-[9px] gap-0.5", roleConfig.color)}>
                      <RoleIcon className="w-2.5 h-2.5" /> {roleConfig.label}
                    </Badge>
                    {member.role !== "owner" && (
                      <Button size="sm" variant="ghost" onClick={() => removeMember(member.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role permissions */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Role Permissions</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="rounded-lg border border-border p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("w-3.5 h-3.5", config.color)} />
                      <span className="text-xs font-medium text-foreground">{config.label}</span>
                    </div>
                    <div className="space-y-0.5">
                      {config.permissions.map((p) => (
                        <div key={p} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <CheckCircle2 className="w-2.5 h-2.5 text-primary" />
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</p>
            {activity.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span><span className="font-medium text-foreground">{item.user}</span> {item.action} <span className="text-foreground">{item.target}</span></span>
                <span className="ml-auto text-[10px] shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
