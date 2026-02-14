import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle, XCircle, ExternalLink, Download, Loader2,
  Shield, Clock, Puzzle, Layout, Sparkles, Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  plugin: "Plugin",
  template: "Template",
  application: "Application",
  "ai-tool": "AI Tool",
  theme: "Theme",
  tool: "Tool",
};

function getCategoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

interface MarketplaceSubmission {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  version: string;
  approval_status: string;
  demo_url: string | null;
  download_url: string | null;
  submitted_by: string | null;
  created_at: string;
  reviewer_notes: string | null;
}

export default function PluginApprovalsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MarketplaceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    if (user) {
      checkAdmin();
      loadItems();
    }
  }, [user]);

  const checkAdmin = async () => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: user!.id,
      _role: "admin",
    });
    setIsAdmin(!!data);
  };

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("plugins")
      .select("id, name, slug, category, description, version, approval_status, demo_url, download_url, submitted_by, created_at, reviewer_notes")
      .order("created_at", { ascending: false });
    if (data) setItems(data as MarketplaceSubmission[]);
    setLoading(false);
  };

  const handleApproval = async (item: MarketplaceSubmission, status: "approved" | "rejected") => {
    setActionId(item.id);
    const label = getCategoryLabel(item.category);
    const { error } = await supabase
      .from("plugins")
      .update({
        approval_status: status,
        reviewer_notes: notes[item.id] || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user!.id,
      })
      .eq("id", item.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "approved" ? `${label} Approved ✓` : `${label} Rejected` });
      loadItems();
    }
    setActionId(null);
  };

  const categoryIcon = (cat: string) => {
    if (cat === "template") return <Layout className="w-4 h-4 text-chart-3" />;
    if (cat === "ai-tool" || cat === "tool") return <Sparkles className="w-4 h-4 text-chart-2" />;
    if (cat === "application") return <Eye className="w-4 h-4 text-chart-1" />;
    return <Puzzle className="w-4 h-4 text-primary" />;
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30 text-xs"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
    return <Badge className="bg-chart-5/20 text-chart-5 border-chart-5/30 text-xs"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  const filtered = items.filter((p) => filter === "all" || p.approval_status === filter);

  if (!isAdmin && !loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-6xl">
          <div className="text-center py-20">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">You don't have admin access to view this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </span>
              Marketplace Approvals
            </h1>
            <p className="text-sm text-muted-foreground">Review, test, and approve submitted plugins, templates, applications & tools.</p>
          </div>
        </div>

        {/* Colorful hero */}
        <div className="rounded-xl p-5 text-primary-foreground relative overflow-hidden mb-6" style={{ background: "linear-gradient(135deg, hsl(var(--chart-1)), hsl(var(--chart-2)))" }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary-foreground/10 blur-2xl" />
          <h2 className="text-lg font-bold relative z-10">🛡️ Submission Review Queue</h2>
          <p className="text-sm opacity-90 mt-1 relative z-10">
            {items.filter((p) => p.approval_status === "pending").length} pending · {items.filter((p) => p.approval_status === "approved").length} approved · {items.filter((p) => p.approval_status === "rejected").length} rejected
          </p>
        </div>

        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending</TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1.5"><XCircle className="w-3.5 h-3.5" /> Rejected</TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5"><Eye className="w-3.5 h-3.5" /> All</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">No {filter === "all" ? "" : filter} submissions found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl border p-5 transition-all duration-300 bg-gradient-to-br",
                      item.approval_status === "pending" && "from-chart-5/5 to-chart-2/5 border-chart-5/20",
                      item.approval_status === "approved" && "from-chart-4/5 to-chart-3/5 border-chart-4/20",
                      item.approval_status === "rejected" && "from-destructive/5 to-destructive/3 border-destructive/20",
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            item.category === "plugin" && "bg-primary/15",
                            item.category === "template" && "bg-chart-3/15",
                            item.category === "application" && "bg-chart-1/15",
                            (item.category === "ai-tool" || item.category === "tool") && "bg-chart-2/15",
                          )}>
                            {categoryIcon(item.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{item.name}</h3>
                              <Badge variant="outline" className="text-[10px]">{getCategoryLabel(item.category)}</Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">v{item.version} · {item.slug}</span>
                          </div>
                          <div className="ml-auto">{statusBadge(item.approval_status)}</div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.description}</p>
                        
                        {/* Links */}
                        <div className="flex items-center gap-3 mb-3">
                          {item.demo_url && (
                            <a
                              href={item.demo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> Live Demo
                            </a>
                          )}
                          {item.download_url && (
                            <a
                              href={item.download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-chart-3 hover:text-chart-3/80 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-chart-3/10 transition-colors"
                            >
                              <Download className="w-3 h-3" /> Download
                            </a>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            Submitted {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Existing reviewer notes */}
                        {item.reviewer_notes && item.approval_status !== "pending" && (
                          <div className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground border border-border">
                            <span className="font-medium text-foreground">Review notes:</span> {item.reviewer_notes}
                          </div>
                        )}
                      </div>

                      {/* Actions (only for pending) */}
                      {item.approval_status === "pending" && (
                        <div className="flex flex-col gap-2 lg:w-64 shrink-0">
                          <Textarea
                            placeholder="Reviewer notes (optional)..."
                            value={notes[item.id] || ""}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            className="text-xs min-h-[60px] resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 gap-1 bg-chart-4 hover:bg-chart-4/90"
                              onClick={() => handleApproval(item, "approved")}
                              disabled={actionId === item.id}
                            >
                              {actionId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 gap-1"
                              onClick={() => handleApproval(item, "rejected")}
                              disabled={actionId === item.id}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
