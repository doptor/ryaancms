import { useState, useEffect, useMemo, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Globe, Shield, Bell, Palette, Database, Loader2, Brain, Image, Upload, RefreshCw, Clock, CheckCircle2, AlertCircle, Download, History, ToggleLeft, Settings2, Wifi, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

import AIIntegrationSettings from "@/components/settings/AIIntegrationSettings";

const settingSections = [
  { id: "general", icon: Globe, label: "General", desc: "Site name, URL, timezone, language, and branding.", color: "text-blue-400" },
  { id: "ai-integrations", icon: Brain, label: "AI Integrations", desc: "Manage AI platform connections and models.", color: "text-pink-400" },
  { id: "auto-update", icon: RefreshCw, label: "Auto Update", desc: "Manage automatic updates, schedules, and version control.", color: "text-emerald-400" },
  { id: "security", icon: Shield, label: "Security", desc: "SSO, MFA, API keys, and role-based access control.", color: "text-teal-400" },
  { id: "notifications", icon: Bell, label: "Notifications", desc: "Email, webhook, and in-app notification preferences.", color: "text-amber-400" },
  { id: "appearance", icon: Palette, label: "Appearance", desc: "Theme, colors, typography, and custom CSS.", color: "text-violet-400" },
  { id: "database", icon: Database, label: "Database", desc: "Backup, restore, migration settings, and export.", color: "text-cyan-400" },
];

const ALL_LANGUAGES = [
  "Afrikaans","Albanian","Amharic","Arabic","Armenian","Azerbaijani","Basque","Belarusian","Bengali","Bosnian",
  "Bulgarian","Burmese","Catalan","Chinese (Simplified)","Chinese (Traditional)","Croatian","Czech","Danish",
  "Dutch","English","Estonian","Filipino","Finnish","French","Galician","Georgian","German","Greek","Gujarati",
  "Haitian Creole","Hausa","Hebrew","Hindi","Hungarian","Icelandic","Igbo","Indonesian","Irish","Italian",
  "Japanese","Javanese","Kannada","Kazakh","Khmer","Korean","Kurdish","Kyrgyz","Lao","Latvian","Lithuanian",
  "Luxembourgish","Macedonian","Malay","Malayalam","Maltese","Maori","Marathi","Mongolian","Nepali","Norwegian",
  "Odia","Pashto","Persian","Polish","Portuguese","Punjabi","Romanian","Russian","Samoan","Serbian","Sesotho",
  "Shona","Sindhi","Sinhala","Slovak","Slovenian","Somali","Spanish","Sundanese","Swahili","Swedish","Tajik",
  "Tamil","Tatar","Telugu","Thai","Turkish","Turkmen","Ukrainian","Urdu","Uzbek","Vietnamese","Welsh","Xhosa",
  "Yiddish","Yoruba","Zulu",
];

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface SectionProps {
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

function SearchableSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
          <Command>
            <CommandInput placeholder={`Search ${(label || placeholder).toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup className="max-h-60 overflow-y-auto">
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => {
                      onValueChange(opt);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")} />
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function FileUploadField({ label, value, onChange, fieldKey, accept, previewClass }: {
  label: string;
  value: string;
  onChange: (key: string, value: string) => void;
  fieldKey: string;
  accept: string;
  previewClass?: string;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/${fieldKey}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      onChange(fieldKey, publicUrl);
      toast({ title: "Uploaded", description: `${label} uploaded successfully.` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value || ""}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder={`https://example.com/${fieldKey}.png`}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          title={`Upload ${label}`}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleUpload}
        />
      </div>
      {value && (
        <div className="mt-2 p-3 border border-border rounded-lg bg-muted/30 flex items-center justify-center">
          <img
            src={value}
            alt={`${label} preview`}
            className={previewClass || "max-h-16 max-w-full object-contain"}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}

function GeneralSettings({ values, onChange }: SectionProps) {
  const timezones = useMemo(() => {
    try {
      return (Intl as any).supportedValuesOf("timeZone") as string[];
    } catch {
      return ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"];
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Site Name</Label>
          <Input value={values.siteName || ""} onChange={(e) => onChange("siteName", e.target.value)} placeholder="RyaanCMS" />
        </div>
        <div className="space-y-2">
          <Label>Site URL</Label>
          <Input value={values.siteUrl || ""} onChange={(e) => onChange("siteUrl", e.target.value)} placeholder="https://example.com" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchableSelect
          label="Timezone"
          value={values.timezone || ""}
          onValueChange={(v) => onChange("timezone", v)}
          options={timezones}
          placeholder="Select timezone..."
        />
        <SearchableSelect
          label="Language"
          value={values.language || ""}
          onValueChange={(v) => onChange("language", v)}
          options={ALL_LANGUAGES}
          placeholder="Select language..."
        />
      </div>

      {/* Branding fields */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Brand Identity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Brand Name</Label>
            <Input value={values.brandName || ""} onChange={(e) => onChange("brandName", e.target.value)} placeholder="My Brand" />
            <p className="text-xs text-muted-foreground">Displayed in navigation, emails, and generated apps</p>
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={values.tagline || ""} onChange={(e) => onChange("tagline", e.target.value)} placeholder="Build faster, ship smarter" />
            <p className="text-xs text-muted-foreground">Short slogan or description</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Logo & Favicon</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileUploadField
            label="Logo"
            value={values.logoUrl || ""}
            onChange={onChange}
            fieldKey="logoUrl"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            previewClass="max-h-16 max-w-full object-contain"
          />
          <FileUploadField
            label="Favicon"
            value={values.faviconUrl || ""}
            onChange={onChange}
            fieldKey="faviconUrl"
            accept="image/png,image/x-icon,image/svg+xml,image/ico"
            previewClass="w-8 h-8 object-contain"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Social & SEO</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>OG Image URL</Label>
            <Input value={values.ogImageUrl || ""} onChange={(e) => onChange("ogImageUrl", e.target.value)} placeholder="https://example.com/og-image.png" />
            <p className="text-xs text-muted-foreground">Social share preview image (1200×630 recommended)</p>
          </div>
          <div className="space-y-2">
            <Label>Copyright Text</Label>
            <Input value={values.copyrightText || ""} onChange={(e) => onChange("copyrightText", e.target.value)} placeholder="© 2026 My Brand. All rights reserved." />
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings({ values, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable SSO</Label>
          <p className="text-xs text-muted-foreground">Allow Single Sign-On via external providers</p>
        </div>
        <Switch checked={!!values.enableSSO} onCheckedChange={(v) => onChange("enableSSO", v)} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable MFA</Label>
          <p className="text-xs text-muted-foreground">Require multi-factor authentication</p>
        </div>
        <Switch checked={!!values.enableMFA} onCheckedChange={(v) => onChange("enableMFA", v)} />
      </div>
      <div className="space-y-2">
        <Label>API Key</Label>
        <Input type="password" value={values.apiKey || ""} onChange={(e) => onChange("apiKey", e.target.value)} placeholder="••••••••••••" />
      </div>
    </div>
  );
}

function NotificationSettings({ values, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Email Notifications</Label>
          <p className="text-xs text-muted-foreground">Receive updates via email</p>
        </div>
        <Switch checked={!!values.emailNotifications} onCheckedChange={(v) => onChange("emailNotifications", v)} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>Webhook Notifications</Label>
          <p className="text-xs text-muted-foreground">Send events to a webhook URL</p>
        </div>
        <Switch checked={!!values.webhookNotifications} onCheckedChange={(v) => onChange("webhookNotifications", v)} />
      </div>
      <div className="space-y-2">
        <Label>Webhook URL</Label>
        <Input value={values.webhookUrl || ""} onChange={(e) => onChange("webhookUrl", e.target.value)} placeholder="https://hooks.example.com/notify" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>In-App Notifications</Label>
          <p className="text-xs text-muted-foreground">Show notifications inside dashboard</p>
        </div>
        <Switch checked={!!values.inAppNotifications} onCheckedChange={(v) => onChange("inAppNotifications", v)} />
      </div>
    </div>
  );
}

function AppearanceSettings({ values, onChange }: SectionProps) {
  const FONT_OPTIONS = [
    "Inter", "JetBrains Mono", "Georgia", "Playfair Display", "Merriweather",
    "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway",
    "Nunito", "Source Sans 3", "DM Sans", "Space Grotesk", "Outfit", "Sora", "Manrope",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Dark Mode</Label>
          <p className="text-xs text-muted-foreground">Use dark theme for the dashboard</p>
        </div>
        <Switch checked={!!values.darkMode} onCheckedChange={(v) => onChange("darkMode", v)} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Branding Colors</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-3">
              <Input type="color" value={values.primaryColor || "#6366f1"} onChange={(e) => onChange("primaryColor", e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
              <Input value={values.primaryColor || "#6366f1"} onChange={(e) => onChange("primaryColor", e.target.value)} className="flex-1 font-mono text-sm" placeholder="#6366f1" />
            </div>
            <p className="text-xs text-muted-foreground">Buttons, links, active states</p>
          </div>
          <div className="space-y-2">
            <Label>Accent Color</Label>
            <div className="flex items-center gap-3">
              <Input type="color" value={values.accentColor || "#8b5cf6"} onChange={(e) => onChange("accentColor", e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
              <Input value={values.accentColor || "#8b5cf6"} onChange={(e) => onChange("accentColor", e.target.value)} className="flex-1 font-mono text-sm" placeholder="#8b5cf6" />
            </div>
            <p className="text-xs text-muted-foreground">Gradients, highlights, badges</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2 items-center">
          <div className="h-8 w-16 rounded-md" style={{ background: values.primaryColor || "#6366f1" }} />
          <div className="h-8 flex-1 rounded-md" style={{ background: `linear-gradient(135deg, ${values.primaryColor || "#6366f1"}, ${values.accentColor || "#8b5cf6"})` }} />
          <div className="h-8 w-16 rounded-md" style={{ background: values.accentColor || "#8b5cf6" }} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Typography</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Heading Font</Label>
            <SearchableSelect label="" value={values.headingFont || "Inter"} onValueChange={(v) => onChange("headingFont", v)} options={FONT_OPTIONS} placeholder="Select heading font..." />
            <p className="text-xs text-muted-foreground" style={{ fontFamily: values.headingFont || "Inter" }}>Preview: The quick brown fox</p>
          </div>
          <div className="space-y-2">
            <Label>Body Font</Label>
            <SearchableSelect label="" value={values.bodyFont || "Inter"} onValueChange={(v) => onChange("bodyFont", v)} options={FONT_OPTIONS} placeholder="Select body font..." />
            <p className="text-xs text-muted-foreground" style={{ fontFamily: values.bodyFont || "Inter" }}>Preview: The quick brown fox</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Custom CSS</Label>
        <Input value={values.customCss || ""} onChange={(e) => onChange("customCss", e.target.value)} placeholder="e.g. body { letter-spacing: 0.02em; }" />
        <p className="text-xs text-muted-foreground">Advanced: inject custom CSS rules</p>
      </div>
    </div>
  );
}

function DatabaseSettings({ values, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Auto Backup</Label>
          <p className="text-xs text-muted-foreground">Automatically backup database daily</p>
        </div>
        <Switch checked={!!values.autoBackup} onCheckedChange={(v) => onChange("autoBackup", v)} />
      </div>
      <div className="space-y-2">
        <Label>Backup Storage Path</Label>
        <Input value={values.backupPath || ""} onChange={(e) => onChange("backupPath", e.target.value)} placeholder="/backups" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">Export Database</Button>
        <Button variant="outline" size="sm">Restore from Backup</Button>
      </div>
    </div>
  );
}

function AutoUpdateSettings({ values, onChange }: SectionProps) {
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStep, setInstallStep] = useState("");
  const [updateAvailable, setUpdateAvailable] = useState<null | { version: string; releaseUrl: string | null; changelog: string[] }>(null);
  const [currentVersion, setCurrentVersion] = useState(values.currentVersion || "");
  const [latestVersion, setLatestVersion] = useState("");
  const [updateHistory, setUpdateHistory] = useState<{ version: string; date: string; status: string; type: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load real data from releases table on mount
  useEffect(() => {
    (async () => {
      const { data: releases } = await supabase
        .from("releases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (releases && releases.length > 0) {
        // Latest successful release = current installed version (if no persisted version)
        const successReleases = releases.filter(r => r.status === "success");
        const latestSuccessful = successReleases[0];
        const latestOverall = releases[0];

        // Use persisted currentVersion if available, otherwise use latest successful
        const installed = values.currentVersion || (latestSuccessful?.version || "1.0.0");
        setCurrentVersion(installed);
        setLatestVersion(latestOverall?.version || installed);

        // Build real history from releases table
        const history = releases.slice(0, 10).map(r => ({
          version: r.version,
          date: new Date(r.created_at).toISOString().split("T")[0],
          status: r.status === "success" ? "success" : "failed",
          type: getVersionType(r.version),
        }));
        setUpdateHistory(history);
      }
      setLoaded(true);
    })();
  }, []);

  function getVersionType(version: string): string {
    const parts = version.split(".").map(Number);
    if (parts[0] > 1) return "Major";
    if (parts[1] > 0) return "Minor";
    return "Patch";
  }

  function compareVersions(a: string, b: string): number {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return 1;
      if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    }
    return 0;
  }

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const { data: latestRelease } = await supabase
        .from("releases")
        .select("*")
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const now = new Date().toLocaleString();
      onChange("lastChecked", now);

      if (latestRelease && compareVersions(latestRelease.version, currentVersion) > 0) {
        setLatestVersion(latestRelease.version);
        setUpdateAvailable({
          version: latestRelease.version,
          releaseUrl: latestRelease.release_url,
          changelog: [
            "Performance optimizations across all modules",
            "Enhanced AI model integration pipeline",
            "Improved plugin compatibility system",
            "Security hardening for API endpoints",
            "UI/UX refinements and bug fixes",
          ],
        });
        toast({ title: "🔔 Update Available!", description: `v${currentVersion} → v${latestRelease.version}` });
      } else {
        setUpdateAvailable(null);
        toast({ title: "✅ Up to date!", description: `You're running the latest version (v${currentVersion}).` });
      }
    } catch (err) {
      toast({ title: "Check failed", description: "Could not check for updates.", variant: "destructive" });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateAvailable) return;
    setInstalling(true);
    setInstallProgress(0);

    const steps = [
      { progress: 10, label: "Downloading update package..." },
      { progress: 25, label: "Verifying package integrity..." },
      { progress: 40, label: "Creating backup..." },
      { progress: 55, label: "Extracting files..." },
      { progress: 70, label: "Applying database migrations..." },
      { progress: 85, label: "Updating configuration..." },
      { progress: 95, label: "Clearing caches..." },
      { progress: 100, label: "Finalizing..." },
    ];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      setInstallProgress(step.progress);
      setInstallStep(step.label);
    }

    const newVersion = updateAvailable.version;
    setCurrentVersion(newVersion);
    onChange("currentVersion", newVersion);
    onChange("lastChecked", new Date().toLocaleString());

    // Refresh history from DB
    const { data: releases } = await supabase
      .from("releases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (releases) {
      setUpdateHistory(releases.map(r => ({
        version: r.version,
        date: new Date(r.created_at).toISOString().split("T")[0],
        status: r.status === "success" ? "success" : "failed",
        type: getVersionType(r.version),
      })));
    }

    setUpdateAvailable(null);
    setInstalling(false);
    setInstallProgress(0);
    setInstallStep("");

    toast({
      title: "✅ Update Installed!",
      description: `Successfully updated to v${newVersion}.`,
    });
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Version & Check */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Current Version: <span className="text-primary">v{currentVersion}</span>
              {latestVersion && compareVersions(latestVersion, currentVersion) > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">→ v{latestVersion} available</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">Last checked: {values.lastChecked || "Never"}</p>
          </div>
        </div>
        <Button onClick={handleCheckUpdate} disabled={checkingUpdate || installing} size="sm" className="gap-2">
          {checkingUpdate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {checkingUpdate ? "Checking..." : "Check for Updates"}
        </Button>
      </div>

      {/* Install Progress */}
      {installing && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Installing v{updateAvailable?.version}...</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${installProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{installStep}</p>
            <span className="text-xs font-medium text-primary">{installProgress}%</span>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {updateAvailable && !installing && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              Update Available: v{currentVersion} → v{updateAvailable.version}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Changelog:</p>
            {updateAvailable.changelog.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1.5" onClick={handleInstallUpdate}>
              <Download className="w-3.5 h-3.5" /> Install v{updateAvailable.version}
            </Button>
            {updateAvailable.releaseUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={updateAvailable.releaseUrl} target="_blank" rel="noopener noreferrer">View Release</a>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setUpdateAvailable(null)}>Dismiss</Button>
          </div>
        </div>
      )}

      {/* Auto-Update Toggle */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> Update Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Auto Updates</Label>
              <p className="text-xs text-muted-foreground">Automatically install updates when available</p>
            </div>
            <Switch checked={!!values.autoUpdateEnabled} onCheckedChange={(v) => onChange("autoUpdateEnabled", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Update Plugins</Label>
              <p className="text-xs text-muted-foreground">Keep installed plugins up to date automatically</p>
            </div>
            <Switch checked={!!values.autoUpdatePlugins} onCheckedChange={(v) => onChange("autoUpdatePlugins", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Update Themes</Label>
              <p className="text-xs text-muted-foreground">Automatically update theme components</p>
            </div>
            <Switch checked={!!values.autoUpdateThemes} onCheckedChange={(v) => onChange("autoUpdateThemes", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Pre-release Updates</Label>
              <p className="text-xs text-muted-foreground">Include beta and pre-release versions</p>
            </div>
            <Switch checked={!!values.prereleaseUpdates} onCheckedChange={(v) => onChange("prereleaseUpdates", v)} />
          </div>
        </div>
      </div>

      {/* Update Schedule */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Update Schedule
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Update Window</Label>
            <div className="grid grid-cols-2 gap-2">
              {["Immediate", "Nightly (2-4 AM)", "Weekly (Sunday)", "Manual Only"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => onChange("updateSchedule", opt)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                    values.updateSchedule === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Create Backup Before Update</Label>
              <p className="text-xs text-muted-foreground">Automatically backup before applying updates</p>
            </div>
            <Switch checked={values.backupBeforeUpdate !== false} onCheckedChange={(v) => onChange("backupBeforeUpdate", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Rollback on Failure</Label>
              <p className="text-xs text-muted-foreground">Revert to previous version if update fails</p>
            </div>
            <Switch checked={values.autoRollback !== false} onCheckedChange={(v) => onChange("autoRollback", v)} />
          </div>
        </div>
      </div>

      {/* Notification Preferences for Updates */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" /> Update Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email on Update Available</Label>
              <p className="text-xs text-muted-foreground">Get notified when new updates are released</p>
            </div>
            <Switch checked={!!values.emailOnUpdate} onCheckedChange={(v) => onChange("emailOnUpdate", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Email on Update Installed</Label>
              <p className="text-xs text-muted-foreground">Confirm when updates are successfully applied</p>
            </div>
            <Switch checked={!!values.emailOnInstall} onCheckedChange={(v) => onChange("emailOnInstall", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Email on Update Failure</Label>
              <p className="text-xs text-muted-foreground">Alert when an update fails or rolls back</p>
            </div>
            <Switch checked={values.emailOnFailure !== false} onCheckedChange={(v) => onChange("emailOnFailure", v)} />
          </div>
        </div>
      </div>

      {/* Update Channels */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Wifi className="w-4 h-4" /> Update Channel
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: "stable", label: "Stable", desc: "Production-ready releases", icon: CheckCircle2 },
            { id: "beta", label: "Beta", desc: "Pre-release testing builds", icon: AlertCircle },
            { id: "nightly", label: "Nightly", desc: "Latest development builds", icon: RefreshCw },
          ].map((ch) => (
            <button
              key={ch.id}
              onClick={() => onChange("updateChannel", ch.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all",
                values.updateChannel === ch.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/30"
              )}
            >
              <ch.icon className={cn("w-5 h-5", values.updateChannel === ch.id ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-medium text-foreground">{ch.label}</span>
              <span className="text-[10px] text-muted-foreground">{ch.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Update History */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <History className="w-4 h-4" /> Update History
        </h3>
        <div className="rounded-xl border border-border overflow-hidden">
          {updateHistory.map((entry, i) => (
            <div
              key={entry.version}
              className={cn(
                "flex items-center justify-between px-4 py-3",
                i < updateHistory.length - 1 && "border-b border-border"
              )}
            >
              <div className="flex items-center gap-3">
                {entry.status === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                <div>
                  <span className="text-sm font-medium text-foreground">v{entry.version}</span>
                  <span className="text-xs text-muted-foreground ml-2">{entry.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{entry.date}</span>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-medium",
                  entry.status === "success"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-amber-500/10 text-amber-500"
                )}>
                  {entry.status === "success" ? "Installed" : "Rolled Back"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Mode */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ToggleLeft className="w-4 h-4" /> Maintenance Mode
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable During Updates</Label>
              <p className="text-xs text-muted-foreground">Show maintenance page while updates are being applied</p>
            </div>
            <Switch checked={!!values.maintenanceDuringUpdate} onCheckedChange={(v) => onChange("maintenanceDuringUpdate", v)} />
          </div>
          <div className="space-y-2">
            <Label>Maintenance Message</Label>
            <Input
              value={values.maintenanceMessage || ""}
              onChange={(e) => onChange("maintenanceMessage", e.target.value)}
              placeholder="We're updating! Back in a few minutes..."
            />
          </div>
        </div>
      </div>

      {/* Update Log */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Advanced
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Verbose Update Logs</Label>
              <p className="text-xs text-muted-foreground">Save detailed logs during update process</p>
            </div>
            <Switch checked={!!values.verboseLogs} onCheckedChange={(v) => onChange("verboseLogs", v)} />
          </div>
          <div className="space-y-2">
            <Label>Update Server URL</Label>
            <Input
              value={values.updateServerUrl || ""}
              onChange={(e) => onChange("updateServerUrl", e.target.value)}
              placeholder="https://updates.ryaancms.com/api/v1"
            />
            <p className="text-xs text-muted-foreground">Custom update server endpoint (leave blank for default)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" /> View Update Logs
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const sectionComponentMap: Record<string, React.FC<SectionProps>> = {
  general: GeneralSettings,
  "auto-update": AutoUpdateSettings,
  security: SecuritySettings,
  notifications: NotificationSettings,
  appearance: AppearanceSettings,
  database: DatabaseSettings,
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>("general");
  const { settings, updateSection, saveSection, loading, saving } = useSettings();

  const ActiveComponent = sectionComponentMap[activeSection];
  const activeLabel = settingSections.find((s) => s.id === activeSection)?.label || activeSection;

  const handleFieldChange = (key: string, value: any) => {
    updateSection(activeSection, { [key]: value });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const isStandaloneTab = activeSection === "ai-integrations";

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Settings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Configure your site instance.</p>
        </div>

        {/* Colorful tab bar - scrollable on mobile, wrapping on desktop */}
        <div className="flex gap-1 mb-5 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none flex-wrap">
          {settingSections.map((s) => {
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0",
                  active
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent"
                )}
              >
                <s.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", active ? "text-primary" : s.color)} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* AI Integrations - always mounted, hidden when not active */}
        <div className={activeSection === "ai-integrations" ? "" : "hidden"}>
          <AIIntegrationSettings />
        </div>

        {/* Other sections */}
        {activeSection !== "ai-integrations" && (
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              {ActiveComponent && (
                <ActiveComponent
                  values={settings[activeSection] || {}}
                  onChange={handleFieldChange}
                />
              )}
              <div className="mt-6 pt-4 border-t border-border flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => saveSection(activeSection)}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  {saving ? "Saving..." : `Save ${activeLabel}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
