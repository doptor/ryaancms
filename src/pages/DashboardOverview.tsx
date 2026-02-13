import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Send, Plus, Pencil, Trash2, Clock, Paperclip, Palette, Layout, Globe, ShoppingCart, FileText, X, Image } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const preDesignTemplates = [
  {
    label: "Portfolio Website",
    icon: Layout,
    prompt: "Create a modern portfolio website with hero section, about me, projects gallery, skills section, and contact form.",
    colors: ["#6366f1", "#8b5cf6", "#a78bfa"],
  },
  {
    label: "E-Commerce Store",
    icon: ShoppingCart,
    prompt: "Build an e-commerce store with product listing, cart, checkout flow, and order history.",
    colors: ["#f59e0b", "#f97316", "#ef4444"],
  },
  {
    label: "Blog / Magazine",
    icon: FileText,
    prompt: "Create a blog platform with article listing, categories, search, and rich text editor for posts.",
    colors: ["#10b981", "#14b8a6", "#06b6d4"],
  },
  {
    label: "Landing Page",
    icon: Globe,
    prompt: "Design a high-converting landing page with hero, features, testimonials, pricing, and CTA sections.",
    colors: ["#ec4899", "#f43f5e", "#e11d48"],
  },
  {
    label: "Dashboard App",
    icon: Layout,
    prompt: "Build an analytics dashboard with charts, KPI cards, data tables, and filter controls.",
    colors: ["#3b82f6", "#2563eb", "#1d4ed8"],
  },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch display name from profiles
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

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const navigate = useNavigate();

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
      setAttachments([]);
      // Navigate to AI Builder with the prompt
      navigate("/dashboard/ai", { state: { prompt: data.prompt, projectId: data.id } });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, prompt: p }: { id: string; prompt: string }) => {
      const { error } = await supabase
        .from("projects")
        .update({ prompt: p, title: p.slice(0, 60) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingId(null);
      toast({ title: "Project updated!" });
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
    setPlusOpen(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTemplateSelect = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    setPlusOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-primary/20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/30 via-primary/10 to-transparent pointer-events-none" />

        {/* Main content */}
        <div className="relative z-10 w-full max-w-2xl px-4 flex flex-col items-center gap-6">
          {/* Greeting */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">
            Ready to build, {displayName}?
          </h1>

          {/* Prompt input */}
          <div className="w-full rounded-2xl border border-border bg-card shadow-lg">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your project..."
              rows={2}
              className="w-full bg-transparent px-4 pt-4 pb-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {attachments.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {file.type.startsWith("image/") ? (
                      <Image className="w-3 h-3 shrink-0" />
                    ) : (
                      <Paperclip className="w-3 h-3 shrink-0" />
                    )}
                    <span className="max-w-[120px] truncate">{file.name}</span>
                    <button onClick={() => removeAttachment(i)} className="hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between px-4 pb-3">
              {/* + Button with Popover */}
              <Popover open={plusOpen} onOpenChange={setPlusOpen}>
                <PopoverTrigger asChild>
                  <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-2" sideOffset={8}>
                  {/* Attachment option */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium">Attach File</div>
                      <div className="text-xs text-muted-foreground">Upload images or documents</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-border" />

                  {/* Pre-designed templates */}
                  <div className="px-3 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Templates
                    </span>
                  </div>
                  {preDesignTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => handleTemplateSelect(tpl.prompt)}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-0.5 shrink-0">
                        {tpl.colors.map((c, ci) => (
                          <div
                            key={ci}
                            className="w-2 h-5 rounded-sm"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{tpl.label}</div>
                      </div>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
              />

              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || createProject.isPending}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Saved projects */}
          {projects.length > 0 && (
            <div className="w-full mt-4 space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Saved Projects
              </h2>
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    if (editingId !== p.id) {
                      navigate("/dashboard/ai", { state: { prompt: p.prompt, projectId: p.id } });
                    }
                  }}
                  className="rounded-xl border border-border bg-card px-4 py-3 flex items-start gap-3 group hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editingId === p.id ? (
                      <div className="flex gap-2">
                        <input
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          className="flex-1 bg-transparent border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateProject.mutate({ id: p.id, prompt: editPrompt });
                            }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-foreground truncate">{p.prompt}</p>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setEditPrompt(p.prompt);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProject.mutate(p.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
