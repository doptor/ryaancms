import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Send, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DashboardOverview() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const queryClient = useQueryClient();

  const displayName = user?.email?.split("@")[0] || "User";

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

  const createProject = useMutation({
    mutationFn: async (promptText: string) => {
      const { error } = await supabase.from("projects").insert({
        user_id: user!.id,
        prompt: promptText,
        title: promptText.slice(0, 60),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setPrompt("");
      toast({ title: "Project saved!" });
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
            <div className="flex items-center justify-between px-4 pb-3">
              <Plus className="w-5 h-5 text-muted-foreground" />
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
                  className="rounded-xl border border-border bg-card px-4 py-3 flex items-start gap-3 group hover:border-primary/30 transition-colors"
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
