import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Send, Plus, Clock, Search, ChevronLeft, ChevronRight,
  Layout, Globe, ShoppingCart, FileText, Sparkles, FolderOpen,
  MoreVertical, Pencil, Trash2, Paperclip, Link2, Mic, MicOff,
  Palette, ChevronDown, Package, Layers, LayoutGrid, X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
  const [isRecording, setIsRecording] = useState(false);
  const [showContentType, setShowContentType] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState("website");
  const [showColorPresets, setShowColorPresets] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CONTENT_TYPES = [
    { value: "website", label: "🌐 Website", icon: Globe },
    { value: "application", label: "📱 Application", icon: LayoutGrid },
    { value: "plugin", label: "🧩 Plugin", icon: Package },
    { value: "website+application", label: "🌐+📱 Website + App", icon: Layers },
    { value: "application+plugin", label: "📱+🧩 App + Plugin", icon: Layers },
    { value: "full", label: "🌐+📱+🧩 Full Stack", icon: Layers },
  ];

  const COLOR_PRESETS = [
    { name: "Blue", color: "hsl(221, 83%, 53%)" },
    { name: "Purple", color: "hsl(271, 76%, 53%)" },
    { name: "Green", color: "hsl(142, 71%, 45%)" },
    { name: "Orange", color: "hsl(24, 95%, 53%)" },
    { name: "Rose", color: "hsl(346, 77%, 50%)" },
    { name: "Cyan", color: "hsl(189, 94%, 43%)" },
  ];

  const handleMicToggle = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        toast({ title: "🎤 Audio recorded!", description: "Audio-to-text feature will use AI transcription." });
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "🎤 Recording...", description: "Click mic again to stop." });
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

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
        {/* Multi-colorful gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,80%,60%)]/15 via-background to-[hsl(220,80%,55%)]/15" />
          <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-[hsl(0,75%,55%)]/18 blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-[hsl(220,80%,55%)]/18 blur-[100px] translate-x-1/3" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-[hsl(30,90%,55%)]/18 blur-[100px] translate-y-1/3" />
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-[hsl(280,70%,55%)]/15 blur-[80px]" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-[hsl(160,70%,45%)]/12 blur-[90px]" />
          <div className="absolute top-0 right-1/3 w-[250px] h-[250px] rounded-full bg-[hsl(45,90%,55%)]/15 blur-[80px]" />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
          {/* Greeting + Prompt */}
          <div className="flex flex-col items-center gap-4 sm:gap-6 pt-4 sm:pt-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground text-center">
              Ready to build, {displayName}?
            </h1>

            <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lg">
              {/* Toolbar: Content Type + Color Presets */}
              <div className="flex items-center gap-2 flex-wrap px-4 pt-3">
                {/* Content Type Selector */}
                <div className="relative">
                  <button
                    onClick={() => { setShowContentType(!showContentType); setShowColorPresets(false); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                  >
                    {CONTENT_TYPES.find(c => c.value === selectedContentType)?.label || "🌐 Website"}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showContentType && (
                    <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg p-1 z-50 min-w-[180px]">
                      {CONTENT_TYPES.map((ct) => (
                        <button
                          key={ct.value}
                          onClick={() => { setSelectedContentType(ct.value); setShowContentType(false); }}
                          className={cn(
                            "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs text-left transition-colors",
                            selectedContentType === ct.value ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                          )}
                        >
                          <ct.icon className="w-3.5 h-3.5" />
                          {ct.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Color Presets */}
                <div className="relative">
                  <button
                    onClick={() => { setShowColorPresets(!showColorPresets); setShowContentType(false); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                  >
                    <Palette className="w-3 h-3" /> Colors
                  </button>
                  {showColorPresets && (
                    <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg p-2 z-50">
                      <div className="flex gap-1.5">
                        {COLOR_PRESETS.map((cp) => (
                          <button
                            key={cp.name}
                            onClick={() => {
                              setPrompt((prev) => prev + ` Use ${cp.name.toLowerCase()} as primary color.`);
                              setShowColorPresets(false);
                            }}
                            className="group flex flex-col items-center gap-1"
                            title={cp.name}
                          >
                            <div
                              className="w-6 h-6 rounded-full border-2 border-border group-hover:border-foreground/50 transition-colors"
                              style={{ backgroundColor: cp.color }}
                            />
                            <span className="text-[9px] text-muted-foreground">{cp.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* URL input for replication */}
              {showUrlInput && (
                <div className="flex items-center gap-2 px-4 pt-2">
                  <input
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder="Paste website URL to replicate..."
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && urlValue.trim()) {
                        setPrompt((prev) => prev + ` Replicate the design of ${urlValue.trim()}`);
                        setUrlValue("");
                        setShowUrlInput(false);
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    if (urlValue.trim()) {
                      setPrompt((prev) => prev + ` Replicate the design of ${urlValue.trim()}`);
                      setUrlValue("");
                      setShowUrlInput(false);
                    }
                  }} className="gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Go
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowUrlInput(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast({ title: "📎 File attached!", description: file.name });
                  }
                }}
                className="hidden"
              />

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe your ${selectedContentType}...`}
                rows={2}
                className="w-full bg-transparent px-4 pt-3 pb-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                }}
              />
              <div className="flex items-center justify-between px-4 pb-3">
                {/* Left: action buttons */}
                <div className="flex items-center gap-0.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Add"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[180px]">
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2">
                        <Paperclip className="w-4 h-4" />
                        Attachment
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowUrlInput(!showUrlInput)} className="gap-2">
                        <Link2 className="w-4 h-4" />
                        Website URL
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost" size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg transition-colors",
                      isRecording ? "text-destructive bg-destructive/10 hover:bg-destructive/20" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={handleMicToggle}
                    title={isRecording ? "Stop recording" : "Voice input"}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Right: templates dropdown + send */}
                <div className="flex items-center gap-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors whitespace-nowrap shrink-0">
                        <Sparkles className="w-3 h-3" />
                        Templates
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[220px]">
                      {preDesignTemplates.map((tpl, i) => (
                        <DropdownMenuItem key={i} onClick={() => setPrompt(tpl.prompt)} className="gap-2">
                          <tpl.icon className="w-4 h-4" />
                          {tpl.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    onClick={handleSubmit}
                    disabled={!prompt.trim() || createProject.isPending}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0 ml-1"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          {allProjects.length > 0 && (
            <div className="space-y-4">
              {/* Header + Search */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  Projects ({filtered.length})
                </h2>
                <div className="relative w-full sm:w-64">
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
                        {(p as any).logo_url ? (
                          <img src={(p as any).logo_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                        )}
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
                          {(p as any).brand_name || p.title || "Untitled"}
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
