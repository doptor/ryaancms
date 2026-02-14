import { useState, useMemo, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Globe, Shield, Bell, Palette, Database, Loader2, Brain, Image, Upload } from "lucide-react";
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

const sectionComponentMap: Record<string, React.FC<SectionProps>> = {
  general: GeneralSettings,
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

        {/* Active section content */}
        {activeSection === "ai-integrations" ? (
          <AIIntegrationSettings />
        ) : (
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              {ActiveComponent && (
                <ActiveComponent
                  values={settings[activeSection] || {}}
                  onChange={handleFieldChange}
                />
              )}
              {/* Per-tab save button */}
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
