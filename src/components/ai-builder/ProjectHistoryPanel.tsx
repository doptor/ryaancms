import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  History, Loader2, Trash2, RotateCcw, Eye,
  CheckCircle2, AlertCircle, Clock, Database,
  FileCode2, Layers, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectHistoryPanelProps {
  onLoadProject: (memory: any) => void;
}

interface ProjectRecord {
  id: string;
  title: string | null;
  prompt: string;
  status: string;
  created_at: string;
  memory?: any;
}

export function ProjectHistoryPanel({ onLoadProject }: ProjectHistoryPanelProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: projectsData, error: pErr } = await supabase
        .from("projects")
        .select("id, title, prompt, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (pErr) throw pErr;

      // Fetch associated memories
      const projectIds = (projectsData || []).map((p) => p.id);
      let memoriesMap: Record<string, any> = {};

      if (projectIds.length > 0) {
        const { data: memories } = await supabase
          .from("project_memory")
          .select("project_id, status, requirements, modules, db_schema, api_list, ui_components, page_layouts, task_plan, quality_score, suggestions, agent_log, folder_structure, current_step, total_steps")
          .eq("user_id", user.id)
          .in("project_id", projectIds);

        if (memories) {
          for (const m of memories) {
            memoriesMap[m.project_id] = m;
          }
        }
      }

      setProjects(
        (projectsData || []).map((p) => ({
          ...p,
          memory: memoriesMap[p.id] || null,
        }))
      );
    } catch (err: any) {
      toast({ title: "Failed to load history", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await supabase.from("project_memory").delete().eq("project_id", id);
      await supabase.from("projects").delete().eq("id", id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Deleted", description: "Project removed from history." });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoad = (project: ProjectRecord) => {
    if (project.memory) {
      onLoadProject(project.memory);
      toast({ title: "Project loaded!", description: `"${project.title}" restored from memory.` });
    } else {
      toast({ title: "No memory data", description: "This project doesn't have saved build data.", variant: "destructive" });
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <History className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Build History</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Sign in to see your previous builds and reload them.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
          <p className="text-sm text-muted-foreground">Loading build history...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <History className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Build History</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your previous builds will appear here. Start building to create history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Build History ({projects.length})</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={fetchProjects}>
          <RotateCcw className="w-3 h-3" /> Refresh
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {projects.map((project) => {
            const mem = project.memory;
            const isSelected = selectedId === project.id;
            const modules = mem?.modules || [];
            const pages = mem?.page_layouts || [];
            const collections = mem?.db_schema || [];
            const qs = mem?.quality_score?.overall_score;
            const hasMemory = !!mem;

            return (
              <div
                key={project.id}
                className={cn(
                  "rounded-xl border bg-card overflow-hidden transition-all",
                  isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/30"
                )}
              >
                <button
                  onClick={() => setSelectedId(isSelected ? null : project.id)}
                  className="w-full flex items-start gap-3 p-3 text-left"
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    project.status === "generated" ? "bg-primary/10" : "bg-muted"
                  )}>
                    {project.status === "generated" ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{project.title || "Untitled"}</p>
                      {qs && (
                        <Badge variant="secondary" className="text-[10px] h-4 shrink-0">{qs}/100</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{project.prompt}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(project.created_at)}</span>
                      {pages.length > 0 && <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {pages.length} pages</span>}
                      {collections.length > 0 && <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {collections.length} tables</span>}
                    </div>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform mt-1", isSelected && "rotate-90")} />
                </button>

                {isSelected && (
                  <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                    {modules.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {modules.map((m: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{m}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm" className="flex-1 gap-1.5 text-xs h-8"
                        onClick={() => handleLoad(project)}
                        disabled={!hasMemory}
                      >
                        <RotateCcw className="w-3 h-3" /> Load Build
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                      >
                        {deletingId === project.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </Button>
                    </div>
                    {!hasMemory && (
                      <p className="text-[10px] text-muted-foreground">No build memory saved for this project.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
