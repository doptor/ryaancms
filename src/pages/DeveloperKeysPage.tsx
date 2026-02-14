import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Key, Plus, Trash2, Copy, Loader2, AlertTriangle, CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MARKETPLACE_ENDPOINTS } from "@/lib/marketplace-config";
import { toast } from "@/hooks/use-toast";

interface ApiKeyRow {
  id: string;
  key_prefix: string;
  label: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function DeveloperKeysPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadKeys();
  }, [user]);

  const loadKeys = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("developer_api_keys")
      .select("id, key_prefix, label, is_active, last_used_at, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setKeys(data as ApiKeyRow[]);
    setLoading(false);
  };

  const generateKey = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(MARKETPLACE_ENDPOINTS.generateKey, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ label: newLabel || "Default" }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to generate key");

      setNewKey(result.api_key);
      setNewLabel("");
      loadKeys();
      toast({ title: "API Key Generated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const deleteKey = async (id: string) => {
    await supabase.from("developer_api_keys").delete().eq("id", id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast({ title: "API Key deleted" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Key className="w-4 h-4 text-primary" />
            </span>
            Developer API Keys
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate API keys to submit plugins from self-hosted CMS instances to the central marketplace.
          </p>
        </div>

        {/* Generate new key */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Generate New Key</h2>
          <div className="flex gap-3">
            <Input
              placeholder="Key label (e.g. My Server)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={generateKey} disabled={generating} className="gap-1.5">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate
            </Button>
          </div>

          {/* Newly generated key display */}
          {newKey && (
            <div className="mt-4 rounded-lg border border-chart-5/30 bg-chart-5/10 p-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-chart-5 mt-0.5 shrink-0" />
                <p className="text-xs text-foreground font-medium">
                  এই key টি এখনই কপি করে রাখুন — আর দেখানো হবে না!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background rounded-md px-3 py-2 font-mono border border-border break-all">
                  {newKey}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(newKey)} className="gap-1 shrink-0">
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Usage docs */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">How to Submit from Self-Hosted CMS</h2>
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto text-muted-foreground">
{`POST ${MARKETPLACE_ENDPOINTS.submit}
Headers:
  x-api-key: rcms_YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "name": "My Plugin",
  "slug": "my-plugin",
  "category": "plugin",
  "description": "A cool plugin",
  "version": "1.0.0",
  "download_url": "https://...",
  "tags": ["analytics", "dashboard"]
}`}
          </pre>
        </div>

        {/* Existing keys */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Your API Keys</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No API keys yet. Generate one above.</p>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{k.label}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {k.is_active ? <><CheckCircle className="w-2.5 h-2.5 mr-0.5 text-chart-4" /> Active</> : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span className="font-mono">{k.key_prefix}••••••••</span>
                      <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
                      {k.last_used_at && <span>Last used {new Date(k.last_used_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteKey(k.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
