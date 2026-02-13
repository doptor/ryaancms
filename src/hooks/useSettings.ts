import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type SettingsData = Record<string, Record<string, any>>;

const DEFAULT_SETTINGS: SettingsData = {
  general: {
    siteName: "RyaanCMS",
    siteUrl: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: "English",
  },
  security: {
    enableSSO: false,
    enableMFA: false,
    apiKey: "",
  },
  notifications: {
    emailNotifications: true,
    webhookNotifications: false,
    webhookUrl: "",
    inAppNotifications: true,
  },
  appearance: {
    darkMode: true,
    primaryColor: "#6366f1",
    accentColor: "#8b5cf6",
    headingFont: "Inter",
    bodyFont: "Inter",
    customCss: "",
  },
  database: {
    autoBackup: true,
    backupPath: "/backups",
  },
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load all settings on mount
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to load settings:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const loaded = { ...DEFAULT_SETTINGS };
        data.forEach((row: any) => {
          loaded[row.key] = { ...DEFAULT_SETTINGS[row.key], ...row.value };
        });
        setSettings(loaded);
      }
      setLoading(false);
    };

    load();
  }, [user]);

  const updateSection = useCallback((section: string, values: Record<string, any>) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...values },
    }));
  }, []);

  const saveAll = useCallback(async () => {
    if (!user) return;
    setSaving(true);

    try {
      const upserts = Object.entries(settings).map(([key, value]) => ({
        user_id: user.id,
        key,
        value,
      }));

      for (const item of upserts) {
        const { error } = await supabase
          .from("site_settings")
          .upsert(item, { onConflict: "user_id,key" });
        if (error) throw error;
      }

      toast({ title: "Settings saved", description: "Your changes have been saved successfully." });
      // Notify branding context to re-apply
      window.dispatchEvent(new Event("branding-updated"));
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Error saving settings", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [user, settings]);

  return { settings, updateSection, saveAll, loading, saving };
}
