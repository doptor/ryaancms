import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Settings, Save, Loader2 } from "lucide-react";

const SETTINGS_KEYS = [
  { key: "company_name", label: "Company Name", type: "text", category: "general" },
  { key: "company_email", label: "Company Email", type: "text", category: "general" },
  { key: "company_phone", label: "Company Phone", type: "text", category: "general" },
  { key: "company_address", label: "Company Address", type: "textarea", category: "general" },
  { key: "default_commission_rate", label: "Default Agent Commission Rate (%)", type: "number", category: "commission" },
  { key: "default_currency", label: "Default Currency", type: "select", options: ["USD", "AUD", "GBP", "CAD", "EUR", "NZD"], category: "commission" },
  { key: "auto_assign_counsellor", label: "Auto-Assign Counsellor to New Students", type: "toggle", category: "automation" },
  { key: "email_on_app_status", label: "Email Notifications on Application Status Change", type: "toggle", category: "notifications" },
  { key: "email_on_visa_update", label: "Email Notifications on Visa Updates", type: "toggle", category: "notifications" },
  { key: "email_on_commission", label: "Email Notifications on Commission Updates", type: "toggle", category: "notifications" },
  { key: "required_docs_passport", label: "Require Passport for Applications", type: "toggle", category: "documents" },
  { key: "required_docs_english_test", label: "Require English Test Score", type: "toggle", category: "documents" },
  { key: "required_docs_academic", label: "Require Academic Certificates", type: "toggle", category: "documents" },
  { key: "visa_checklist_template", label: "Default Visa Document Checklist", type: "textarea", category: "documents" },
];

export default function EducaSettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["educa_settings"], queryFn: async () => {
      const { data, error } = await supabase.from("educa_settings").select("*");
      if (error) throw error; return data ?? [];
    }, enabled: !!user,
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s: any) => { map[s.setting_key] = s.setting_value || ""; });
      setValues(map);
    }
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const upserts = Object.entries(values).map(([key, val]) => ({
        user_id: user!.id, setting_key: key, setting_value: val,
        category: SETTINGS_KEYS.find(s => s.key === key)?.category || "general",
      }));
      for (const u of upserts) {
        const { error } = await supabase.from("educa_settings").upsert(u, { onConflict: "user_id,setting_key" });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_settings"] }); toast({ title: "Settings saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const categories = [...new Set(SETTINGS_KEYS.map(s => s.category))];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> EDUCA Settings</h1>
            <p className="text-muted-foreground text-sm">Configure your education consultancy platform</p>
          </div>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save Settings
          </Button>
        </div>

        {isLoading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
          categories.map(cat => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-base capitalize">{cat}</CardTitle>
                <CardDescription>
                  {cat === "general" && "Basic company information"}
                  {cat === "commission" && "Default commission and currency settings"}
                  {cat === "automation" && "Automation rules"}
                  {cat === "notifications" && "Email & notification preferences"}
                  {cat === "documents" && "Document requirements & templates"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {SETTINGS_KEYS.filter(s => s.category === cat).map(setting => (
                  <div key={setting.key} className="flex items-center justify-between gap-4">
                    {setting.type === "toggle" ? (
                      <>
                        <Label className="flex-1">{setting.label}</Label>
                        <Switch checked={values[setting.key] === "true"} onCheckedChange={v => setValues(p => ({ ...p, [setting.key]: v ? "true" : "false" }))} />
                      </>
                    ) : setting.type === "textarea" ? (
                      <div className="w-full"><Label>{setting.label}</Label><Textarea value={values[setting.key] || ""} onChange={e => setValues(p => ({ ...p, [setting.key]: e.target.value }))} rows={3} /></div>
                    ) : setting.type === "select" ? (
                      <div className="w-full"><Label>{setting.label}</Label>
                        <Select value={values[setting.key] || ""} onValueChange={v => setValues(p => ({ ...p, [setting.key]: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{setting.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                      </div>
                    ) : (
                      <div className="w-full"><Label>{setting.label}</Label><Input type={setting.type} value={values[setting.key] || ""} onChange={e => setValues(p => ({ ...p, [setting.key]: e.target.value }))} /></div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
