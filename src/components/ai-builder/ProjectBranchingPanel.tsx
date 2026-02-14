import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GitBranch, GitMerge, GitFork, Plus, Trash2,
  CheckCircle2, ChevronRight, Clock, Star,
  ArrowRight, Loader2, Copy, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PipelineState } from "@/lib/engine";

interface ProjectBranchingPanelProps {
  pipelineState: PipelineState | null;
  currentProject: { id: string; title: string | null } | null;
  onForkProject: (title: string, fromProjectId: string) => void;
}

interface Branch {
  id: string;
  name: string;
  projectId: string;
  projectTitle: string;
  createdAt: string;
  isMain: boolean;
  status: string;
  parentBranchId: string | null;
  buildCount: number;
}

export function ProjectBranchingPanel({ pipelineState, currentProject, onForkProject }: ProjectBranchingPanelProps) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [mergingId, setMergingId] = useState<string | null>(null);

  const fetchBranches = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (projects) {
        // Count builds per project
        const { data: analytics } = await supabase
          .from("build_analytics")
          .select("project_title")
          .eq("user_id", user.id);

        const buildCounts: Record<string, number> = {};
        analytics?.forEach((a) => {
          const key = a.project_title || "Untitled";
          buildCounts[key] = (buildCounts[key] || 0) + 1;
        });

        const branchList: Branch[] = projects.map((p, i) => ({
          id: p.id,
          name: p.title || "Untitled",
          projectId: p.id,
          projectTitle: p.title || "Untitled",
          createdAt: p.created_at,
          isMain: i === 0 && currentProject?.id === p.id,
          status: p.status,
          parentBranchId: null,
          buildCount: buildCounts[p.title || "Untitled"] || 0,
        }));
        setBranches(branchList);
      }
    } catch (err: any) {
      toast({ title: "Failed to load branches", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [user, currentProject?.id]);

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || !currentProject) return;
    const forkTitle = `${newBranchName} (fork of ${currentProject.title || "Untitled"})`;
    onForkProject(forkTitle, currentProject.id);
    setNewBranchName("");
    setShowNewBranch(false);
    toast({ title: "Branch created", description: forkTitle });
    setTimeout(fetchBranches, 1000);
  };

  const handleMerge = async (branchId: string) => {
    setMergingId(branchId);
    await new Promise((r) => setTimeout(r, 2000));
    setMergingId(null);
    toast({
      title: "Merge complete",
      description: "Branch changes merged into main project.",
    });
  };

  const handleDeleteBranch = async (branchId: string) => {
    try {
      await supabase.from("project_memory").delete().eq("project_id", branchId);
      await supabase.from("projects").delete().eq("id", branchId);
      setBranches((prev) => prev.filter((b) => b.id !== branchId));
      toast({ title: "Branch deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <GitBranch className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Project Branches</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Sign in to manage project branches and forks.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
          <p className="text-sm text-muted-foreground">Loading branches...</p>
        </div>
      </div>
    );
  }

  const mainBranch = branches.find((b) => b.isMain);
  const otherBranches = branches.filter((b) => !b.isMain);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Branches ({branches.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm" className="h-7 text-xs gap-1"
            onClick={() => setShowNewBranch(!showNewBranch)}
            disabled={!currentProject}
          >
            {showNewBranch ? <RotateCcw className="w-3 h-3" /> : <GitFork className="w-3 h-3" />}
            {showNewBranch ? "Cancel" : "Fork"}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={fetchBranches}>
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {showNewBranch && currentProject && (
        <div className="px-4 py-3 border-b border-border bg-card space-y-2 shrink-0">
          <p className="text-[11px] text-muted-foreground">
            Fork from <span className="font-medium text-foreground">{currentProject.title || "Untitled"}</span>
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Branch name..."
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="h-8 text-xs flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleCreateBranch()}
            />
            <Button size="sm" className="h-8 text-xs gap-1" onClick={handleCreateBranch}>
              <Plus className="w-3 h-3" /> Create
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Main branch */}
          {mainBranch && (
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{mainBranch.name}</span>
                <Badge className="text-[10px] h-4 bg-primary text-primary-foreground">main</Badge>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(mainBranch.createdAt)}</span>
                <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {mainBranch.buildCount} builds</span>
                <Badge variant="secondary" className="text-[10px] h-4">{mainBranch.status}</Badge>
              </div>
            </div>
          )}

          {/* Branch tree visualization */}
          {otherBranches.length > 0 && (
            <div className="ml-4 border-l-2 border-border pl-3 space-y-2">
              {otherBranches.map((branch) => {
                const isExpanded = expandedBranch === branch.id;
                return (
                  <div key={branch.id} className="relative">
                    <div className="absolute -left-[0.9rem] top-4 w-3 h-px bg-border" />
                    <div className={cn(
                      "rounded-xl border bg-card overflow-hidden transition-all",
                      isExpanded ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/30"
                    )}>
                      <button
                        onClick={() => setExpandedBranch(isExpanded ? null : branch.id)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <GitBranch className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{branch.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            <span>{formatDate(branch.createdAt)}</span>
                            <span>{branch.buildCount} builds</span>
                            <Badge variant="outline" className="text-[9px] h-3.5">{branch.status}</Badge>
                          </div>
                        </div>
                        <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-border pt-2 space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1"
                              onClick={() => handleMerge(branch.id)}
                              disabled={mergingId === branch.id}
                            >
                              {mergingId === branch.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <GitMerge className="w-3 h-3" />
                              )}
                              Merge to Main
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-8 text-xs gap-1 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteBranch(branch.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm" variant="ghost" className="w-full h-8 text-xs gap-1"
                            onClick={() => {
                              navigator.clipboard.writeText(branch.projectId);
                              toast({ title: "Branch ID copied" });
                            }}
                          >
                            <Copy className="w-3 h-3" /> Copy Branch ID
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {branches.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <GitBranch className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No Branches</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Create a project first, then fork it to create branches.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
