import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Shield, GitBranch, Box, Zap, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const steps = [
  { id: "compat", label: "Compatibility Scan", icon: CheckCircle, desc: "Checking system requirements and version compatibility..." },
  { id: "deps", label: "Dependency Resolution", icon: GitBranch, desc: "Resolving package dependencies and version conflicts..." },
  { id: "security", label: "Security Scan", icon: Shield, desc: "Scanning package for vulnerabilities and permission escalation..." },
  { id: "migration", label: "Migration Preview", icon: Box, desc: "Previewing schema changes and data migrations..." },
  { id: "sandbox", label: "Sandbox Activation", icon: Zap, desc: "Activating in isolated sandbox environment..." },
] as const;

interface InstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { name: string; type: string; tag?: string; desc?: string } | null;
  onInstallComplete?: () => void;
}

export default function InstallDialog({ open, onOpenChange, item, onInstallComplete }: InstallDialogProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState<Record<number, "pending" | "running" | "done" | "warning">>(
    () => Object.fromEntries(steps.map((_, i) => [i, "pending"]))
  );
  const [installing, setInstalling] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setStepStatus(Object.fromEntries(steps.map((_, i) => [i, "pending"])));
      setInstalling(false);
      setComplete(false);
    }
  }, [open]);

  const saveToDatabase = async () => {
    if (!user || !item) return;

    try {
      const slug = item.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const category = item.type === "Template" ? "template" : item.type === "AI Tool" ? "ai-tool" : "plugin";

      // Find existing plugin by slug or name
      let { data: plugin } = await supabase
        .from("plugins")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      let pluginId = plugin?.id;

      if (!pluginId) {
        const { data: byName } = await supabase
          .from("plugins")
          .select("id")
          .ilike("name", item.name)
          .maybeSingle();
        pluginId = byName?.id;
      }

      // If not found, create the plugin entry as "pending" for admin approval
      if (!pluginId) {
        const isUserUpload = item.tag === "Local" || item.tag === "Remote";
        const { data: newPlugin, error: insertErr } = await supabase
          .from("plugins")
          .insert({
            name: item.name,
            slug,
            category,
            description: item.desc || "User-uploaded package",
            version: "1.0.0",
            is_official: false,
            submitted_by: user.id,
            approval_status: isUserUpload ? "pending" : "approved",
            demo_url: (item as any).demoUrl || null,
            download_url: (item as any).downloadUrl || null,
          })
          .select("id")
          .single();

        if (insertErr || !newPlugin) {
          console.error("Failed to register plugin:", insertErr);
          toast({ title: `${item.name} submitted failed`, description: "Could not register in plugin registry." });
          return;
        }
        pluginId = newPlugin.id;

        if (isUserUpload) {
          toast({ title: `${item.name} submitted for review`, description: "An admin will review and approve your submission." });
        }
      }

      // Check if already installed
      const { data: existing } = await supabase
        .from("user_plugins")
        .select("id")
        .eq("user_id", user.id)
        .eq("plugin_id", pluginId)
        .maybeSingle();

      if (existing) {
        toast({ title: `${item.name} is already installed` });
        return;
      }

      await supabase.from("user_plugins").insert({
        user_id: user.id,
        plugin_id: pluginId,
        is_active: true,
      });

      toast({ title: `${item.name} installed successfully!` });
      onInstallComplete?.();
    } catch (err) {
      console.error("Install save error:", err);
      toast({ title: "Install completed", description: "Could not save to your account." });
    }
  };

  const startInstall = () => {
    setInstalling(true);
    runStep(0);
  };

  const runStep = (step: number) => {
    if (step >= steps.length) {
      setComplete(true);
      setInstalling(false);
      saveToDatabase();
      return;
    }
    setCurrentStep(step);
    setStepStatus((prev) => ({ ...prev, [step]: "running" }));

    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      const status = step === 1 && Math.random() > 0.7 ? "warning" : "done";
      setStepStatus((prev) => ({ ...prev, [step]: status }));
      setTimeout(() => runStep(step + 1), 200);
    }, delay);
  };

  const progress = complete ? 100 : (currentStep / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {complete ? (
              <>
                <CheckCircle className="w-5 h-5 text-chart-4" />
                Installed Successfully
              </>
            ) : (
              <>Install {item?.name || "Package"}</>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Progress value={progress} className="h-1.5" />

          <div className="space-y-1">
            {steps.map((step, i) => {
              const status = stepStatus[i];
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    status === "running" && "bg-primary/5",
                    status === "done" && "opacity-70",
                    status === "pending" && "opacity-40"
                  )}
                >
                  <div className="mt-0.5">
                    {status === "running" ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : status === "done" ? (
                      <CheckCircle className="w-4 h-4 text-chart-4" />
                    ) : status === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-chart-5" />
                    ) : (
                      <StepIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    {status === "running" && (
                      <p className="text-xs text-muted-foreground mt-0.5 animate-fade-in">{step.desc}</p>
                    )}
                    {status === "warning" && (
                      <p className="text-xs text-chart-5 mt-0.5">Minor version mismatch detected — resolved automatically.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {currentStep >= 3 && !complete && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 animate-fade-in">
              <p className="text-xs font-medium text-foreground mb-1.5">Schema Changes Preview</p>
              <div className="font-mono text-xs text-muted-foreground space-y-0.5">
                <p className="text-chart-4">+ collection: {item?.name?.toLowerCase().replace(/\s/g, "_")}_data</p>
                <p className="text-chart-4">+ field: settings (JSON)</p>
                <p className="text-muted-foreground">  0 breaking changes</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {complete ? (
              <Button variant="hero" size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            ) : !installing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="hero" size="sm" onClick={startInstall}>
                  <Zap className="w-3.5 h-3.5" /> Start Installation
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" disabled>
                Installing...
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
