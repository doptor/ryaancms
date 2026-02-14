import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Send, Plus, Clock, Search, ChevronLeft, ChevronRight,
  Layout, Globe, ShoppingCart, FileText, Sparkles, FolderOpen,
  MoreVertical, Pencil, Trash2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PROJECTS_PER_PAGE = 20;

const preDesignTemplates = [
  { label: "Portfolio Website", icon: Layout, prompt: "Create a modern portfolio website with hero section, about me, projects gallery, skills section, and contact form." },
  { label: "E-Commerce Store", icon: ShoppingCart, prompt: "Build an e-commerce store with product listing, cart, checkout flow, and order history." },
  { label: "Blog / Magazine", icon: FileText, prompt: "Create a blog platform with article listing, categories, search, and rich text editor for posts." },
  { label: "Landing Page", icon: Globe, prompt: "Design a high-converting landing page with hero, features, testimonials, pricing, and CTA sections." },
  { label: "Dashboard App", icon: Layout, prompt: "Build an analytics dashboard with charts, KPI cards, data tables, and filter controls." },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  const { data: allProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Filter + paginate
  const filtered = allProjects.filter((p) =>
    (p.title || p.prompt).toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PROJECTS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE
  );

  const createProject = useMutation({
    mutationFn: async (promptText: string) => {
      const { data, error } = await supabase.from("projects").insert({
        user_id: user!.id,
        prompt: promptText,
        title: promptText.slice(0, 60),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setPrompt("");
      navigate("/dashboard/ai", { state: { prompt: data.prompt, projectId: data.id } });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from("projects").update({ title }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingId(null);
      toast({ title: "Project renamed!" });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Project deleted" });
    },
  });

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    createProject.mutate(prompt.trim());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "generated": return "bg-primary/10 text-primary";
      case "deployed": return "bg-chart-2/10 text-chart-2";
      default: return "bg-muted text-muted-foreground";
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
    <DashboardLayout>
      <div className="flex flex-col min-h-screen relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-primary/20 pointer-events-none" />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Greeting + Prompt */}
          <div className="flex flex-col items-center gap-6 pt-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">
              Ready to build, {displayName}?
            </h1>

            <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lg">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your project..."
                rows={2}
                className="w-full bg-transparent px-4 pt-4 pb-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                }}
              />
              <div className="flex items-center justify-between px-4 pb-3">
                {/* Templates */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {preDesignTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(tpl.prompt)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors whitespace-nowrap shrink-0"
                    >
                      <tpl.icon className="w-3 h-3" />
                      {tpl.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || createProject.isPending}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0 ml-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          {allProjects.length > 0 && (
            <div className="space-y-4">
              {/* Header + Search */}
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  Projects ({filtered.length})
                </h2>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Search projects..."
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>

              {/* Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {paginated.map((p) => (
                  <Card
                    key={p.id}
                    className="group cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
                    onClick={() => {
                      if (editingId !== p.id) {
                        navigate("/dashboard/ai", { state: { prompt: p.prompt, projectId: p.id } });
                      }
                    }}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Top row: icon + menu */}
                      <div className="flex items-start justify-between">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => { setEditingId(p.id); setEditTitle(p.title || ""); }}>
                              <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteProject.mutate(p.id)}>
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Title */}
                      {editingId === p.id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") updateProject.mutate({ id: p.id, title: editTitle });
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 text-xs"
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {p.title || "Untitled"}
                        </h3>
                      )}

                      {/* Prompt preview */}
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {p.prompt || "No description"}
                      </p>

                      {/* Footer: status + date */}
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="secondary" className={`text-[9px] ${getStatusColor(p.status)}`}>
                          {p.status}
                        </Badge>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDate(p.updated_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                  </Button>
                  <span className="text-xs text-muted-foreground px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
