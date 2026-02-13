import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Globe, Shield, Bell, Palette, Database, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { Skeleton } from "@/components/ui/skeleton";

const settingSections = [
  { id: "general", icon: Globe, label: "General", desc: "Site name, URL, timezone, and language settings.", color: "text-blue-400" },
  { id: "security", icon: Shield, label: "Security", desc: "SSO, MFA, API keys, and role-based access control.", color: "text-emerald-400" },
  { id: "notifications", icon: Bell, label: "Notifications", desc: "Email, webhook, and in-app notification preferences.", color: "text-amber-400" },
  { id: "appearance", icon: Palette, label: "Appearance", desc: "Theme, branding, custom CSS, and favicon.", color: "text-violet-400" },
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
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
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

function GeneralSettings({ values, onChange }: SectionProps) {
  const timezones = useMemo(() => {
    try {
      return (Intl as any).supportedValuesOf("timeZone") as string[];
    } catch {
      return ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"];
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Site Name</Label>
        <Input value={values.siteName || ""} onChange={(e) => onChange("siteName", e.target.value)} placeholder="RyaanCMS" />
      </div>
      <div className="space-y-2">
        <Label>Site URL</Label>
        <Input value={values.siteUrl || ""} onChange={(e) => onChange("siteUrl", e.target.value)} placeholder="https://example.com" />
      </div>
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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Dark Mode</Label>
          <p className="text-xs text-muted-foreground">Use dark theme for the dashboard</p>
        </div>
        <Switch checked={!!values.darkMode} onCheckedChange={(v) => onChange("darkMode", v)} />
      </div>
      <div className="space-y-2">
        <Label>Brand Color</Label>
        <Input type="color" value={values.brandColor || "#6366f1"} onChange={(e) => onChange("brandColor", e.target.value)} className="w-16 h-10" />
      </div>
      <div className="space-y-2">
        <Label>Custom CSS</Label>
        <Input value={values.customCss || ""} onChange={(e) => onChange("customCss", e.target.value)} placeholder="e.g. body { font-family: 'Inter'; }" />
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
  const { settings, updateSection, saveAll, loading, saving } = useSettings();

  const ActiveComponent = sectionComponentMap[activeSection];

  const handleFieldChange = (key: string, value: any) => {
    updateSection(activeSection, { [key]: value });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-4xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
            <p className="text-sm text-muted-foreground">Configure your RyaanCMS instance.</p>
          </div>
          <Button variant="default" size="sm" onClick={saveAll} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Colorful tab bar */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {settingSections.map((s) => {
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent"
                )}
              >
                <s.icon className={cn("w-4 h-4", active ? "text-primary" : s.color)} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Active section content */}
        <Card>
          <CardContent className="pt-6">
            {ActiveComponent && (
              <ActiveComponent
                values={settings[activeSection] || {}}
                onChange={handleFieldChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
