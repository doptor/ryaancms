import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderOpen, Plus, Search, Clock, ChevronDown,
  Loader2, Sparkles, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Project {
  id: string;
  title: string | null;
  prompt: string;
  status: string;
  created_at: string;
  updated_at: string;
  logo_url?: string | null;
  brand_name?: string | null;
}

interface ProjectSelectorProps {
  selectedProject: Project | null;
  onSelectProject: (project: Project | null) => void;
  onCreateProject: (title: string) => void;
}

export function ProjectSelector({ selectedProject, onSelectProject, onCreateProject }: ProjectSelectorProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (user && isOpen) fetchProjects();
  }, [user, isOpen]);

  const fetchProjects = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (data) setProjects(data);
    } catch {}
    setIsLoading(false);
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onCreateProject(newTitle.trim());
    setNewTitle("");
    setShowCreate(false);
    setIsOpen(false);
  };

  const handleSelect = (project: Project) => {
    onSelectProject(project);
    setIsOpen(false);
  };

  const filtered = projects.filter(p =>
    (p.title || p.prompt).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generated": return <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary">Generated</Badge>;
      case "draft": return <Badge variant="secondary" className="text-[9px]">Draft</Badge>;
      case "deployed": return <Badge variant="secondary" className="text-[9px] bg-chart-2/10 text-chart-2">Deployed</Badge>;
      default: return <Badge variant="secondary" className="text-[9px]">{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return "just now";
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 text-xs font-medium max-w-[220px] px-2.5"
        >
          {selectedProject?.logo_url ? (
            <img src={selectedProject.logo_url} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
          ) : (
            <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
          )}
          <span className="truncate">
            {selectedProject ? (selectedProject.brand_name || selectedProject.title || "Untitled") : "No Project"}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Projects</span>
            <Button
              variant="ghost" size="sm"
              className="h-6 text-[11px] gap-1 px-2"
              onClick={() => { setShowCreate(!showCreate); }}
            >
              <Plus className="w-3 h-3" /> New
            </Button>
          </div>

          {showCreate && (
            <div className="flex gap-1.5 mb-2">
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="Project name..."
                className="h-7 text-xs"
                autoFocus
              />
              <Button size="sm" className="h-7 text-xs px-3" onClick={handleCreate} disabled={!newTitle.trim()}>
                Create
              </Button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="h-7 text-xs pl-7"
            />
          </div>
        </div>

        {/* "No project" option */}
        <div className="px-1 pt-1">
          <button
            onClick={() => { onSelectProject(null); setIsOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors",
              !selectedProject ? "bg-primary/10" : "hover:bg-accent"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-foreground">New Session</span>
              <p className="text-[10px] text-muted-foreground">Start without a project</p>
            </div>
          </button>
        </div>

        {/* Project list */}
        <ScrollArea className="max-h-[280px]">
          <div className="px-1 py-1 space-y-0.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {searchQuery ? "No matching projects" : "No projects yet"}
              </p>
            ) : (
              filtered.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project)}
                  className={cn(
                    "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors",
                    selectedProject?.id === project.id ? "bg-primary/10" : "hover:bg-accent"
                  )}
                >
                  {project.logo_url ? (
                    <img src={project.logo_url} alt="" className="w-5 h-5 rounded object-cover shrink-0 mt-0.5" />
                  ) : (
                    <FolderOpen className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground truncate">
                        {project.brand_name || project.title || "Untitled"}
                      </span>
                      {getStatusBadge(project.status)}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {project.prompt.slice(0, 60)}{project.prompt.length > 60 ? "..." : ""}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{formatDate(project.updated_at)}</span>
                    </div>
                  </div>
                  {selectedProject?.id === project.id && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
